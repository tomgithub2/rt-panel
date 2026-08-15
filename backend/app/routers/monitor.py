"""监控：历史曲线、进程、端口、告警规则。"""
import time

import psutil
from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_perm
from ..database import execute, now, query

router = APIRouter(prefix='/api/monitor', tags=['monitor'])

RANGES = {'1h': 3600, '6h': 21600, '24h': 86400, '7d': 604800, '30d': 2592000}


@router.get('/history')
def history(metric: str = 'cpu', range: str = '1h',
            user: dict = Depends(require_perm('monitor:view'))):
    seconds = RANGES.get(range, 3600)
    since = now() - seconds
    table = 'metric_raw' if seconds <= 3600 else 'metric_history'
    valid = {'cpu', 'mem', 'net_rx', 'net_tx', 'disk_read', 'disk_write', 'load1'}
    if metric not in valid:
        raise HTTPException(status_code=400, detail='未知指标')
    rows = query(f'SELECT ts,{metric} AS v FROM {table} WHERE ts>? ORDER BY ts ASC', (since,))
    # 点数过多时降采样
    if len(rows) > 800:
        step = len(rows) // 800 + 1
        rows = rows[::step]
    if metric in ('net_rx', 'net_tx', 'disk_read', 'disk_write'):
        # 累加计数 → 每秒速率
        out = []
        for i, r in enumerate(rows):
            if i == 0:
                out.append({'ts': r['ts'], 'v': 0})
                continue
            dt = max(r['ts'] - rows[i - 1]['ts'], 0.5)
            out.append({'ts': r['ts'], 'v': round((r['v'] - rows[i - 1]['v']) / dt, 0)})
        return {'metric': metric, 'range': range, 'list': out}
    return {'metric': metric, 'range': range, 'list': rows}


@router.get('/processes')
def processes(search: str = '', sort: str = 'cpu', limit: int = 300,
              user: dict = Depends(require_perm('monitor:view'))):
    out = []
    for p in psutil.process_iter(['pid', 'name', 'username', 'status',
                                  'cpu_percent', 'memory_percent', 'memory_info',
                                  'create_time', 'num_threads', 'exe', 'cmdline']):
        try:
            info = p.info
            if search and search.lower() not in (info['name'] or '').lower() \
                    and search.lower() not in ' '.join(info['cmdline'] or []).lower():
                continue
            out.append({
                'pid': info['pid'], 'name': info['name'],
                'user': info['username'] or '',
                'status': info['status'],
                'cpu': round(info['cpu_percent'] or 0, 2),
                'mem': round(info['memory_percent'] or 0, 2),
                'rss': info['memory_info'].rss if info['memory_info'] else 0,
                'threads': info['num_threads'],
                'create_time': info['create_time'],
                'exe': info['exe'] or '',
                'cmdline': ' '.join(info['cmdline'] or [])[:500],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    out.sort(key=lambda x: x.get(sort, 0), reverse=True)
    return {'list': out[:limit], 'total': len(out)}


@router.get('/ports')
def ports(user: dict = Depends(require_perm('monitor:view'))):
    out = []
    seen = set()
    for conn in psutil.net_connections(kind='inet'):
        if conn.status != 'LISTEN':
            continue
        key = (conn.laddr.ip if conn.laddr else '', conn.laddr.port if conn.laddr else 0)
        if key in seen:
            continue
        seen.add(key)
        name = ''
        try:
            if conn.pid:
                name = psutil.Process(conn.pid).name()
        except Exception:
            pass
        out.append({
            'ip': key[0], 'port': key[1], 'pid': conn.pid, 'process': name,
        })
    out.sort(key=lambda x: x['port'])
    return {'list': out}


# ---------------------------------------------------------------- 告警规则
@router.get('/alerts')
def alert_rules(user: dict = Depends(require_perm('monitor:view'))):
    return {'list': query('SELECT * FROM alert_rules ORDER BY id')}


@router.post('/alerts')
def add_alert(body: dict, user: dict = Depends(require_perm('monitor:alert'))):
    metric = body.get('metric')
    if metric not in ('cpu', 'mem', 'disk', 'load1'):
        raise HTTPException(status_code=400, detail='指标无效')
    op = body.get('operator', '>')
    if op not in ('>', '<'):
        raise HTTPException(status_code=400, detail='操作符无效')
    try:
        threshold = float(body.get('threshold'))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail='阈值无效')
    rid = execute(
        'INSERT INTO alert_rules (metric,operator,threshold,duration,enabled,channels) '
        'VALUES (?,?,?,?,?,?)',
        (metric, op, threshold, int(body.get('duration', 60)),
         1 if body.get('enabled', True) else 0,
         ','.join(body.get('channels') or [])))
    return {'id': rid}


@router.put('/alerts/{rid}')
def update_alert(rid: int, body: dict, user: dict = Depends(require_perm('monitor:alert'))):
    rule = query('SELECT * FROM alert_rules WHERE id=?', (rid,), one=True)
    if not rule:
        raise HTTPException(status_code=404, detail='规则不存在')
    execute('UPDATE alert_rules SET enabled=?, channels=? WHERE id=?',
            (1 if body.get('enabled', rule['enabled']) else 0,
             ','.join(body.get('channels') or []) or rule['channels'], rid))
    return {'ok': True}


@router.delete('/alerts/{rid}')
def del_alert(rid: int, user: dict = Depends(require_perm('monitor:alert'))):
    execute('DELETE FROM alert_rules WHERE id=?', (rid,))
    return {'ok': True}


@router.get('/alerts/history')
def alert_history(limit: int = 100, user: dict = Depends(require_perm('monitor:view'))):
    return {'list': query('SELECT * FROM alert_history ORDER BY id DESC LIMIT ?', (limit,))}


@router.get('/connections')
def connections(user: dict = Depends(require_perm('monitor:view'))):
    """TCP 连接统计（按远端 IP 聚合 top50）。"""
    counter = {}
    total = 0
    for conn in psutil.net_connections(kind='inet'):
        if not conn.raddr:
            continue
        total += 1
        key = f"{conn.raddr.ip}:{conn.raddr.port}"
        counter[key] = counter.get(key, 0) + 1
    top = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:50]
    return {'total': total, 'top': [{'endpoint': k, 'count': v} for k, v in top]}
