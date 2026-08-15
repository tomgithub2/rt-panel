# Created by 小杜 on 2026/08

"""进程守护：监控关键进程，异常退出自动拉起。"""
import time

import psutil
from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..database import execute, now, query
from ..utils.exec_utils import run_cmd

router = APIRouter(prefix='/api/guardian', tags=['guardian'],
                   dependencies=[Depends(require_feature('guardian'))])


@router.get('/list')
def guardian_list(user: dict = Depends(require_perm('processes:view'))):
    rows = query('SELECT * FROM guardians ORDER BY id DESC')
    for r in rows:
        r['running'] = _is_running(r['process'])
    return {'list': rows}


def _is_running(process: str) -> bool:
    for p in psutil.process_iter(['name', 'cmdline']):
        try:
            info = p.info
            if process.lower() in (info['name'] or '').lower():
                return True
            if process.lower() in ' '.join(info['cmdline'] or []).lower():
                return True
        except Exception:
            continue
    return False


def _check_all():
    """调度器调用：检查并拉起（返回本次拉起数）。"""
    restarted = 0
    rows = query('SELECT * FROM guardians WHERE enabled=1')
    for g in rows:
        if _is_running(g['process']):
            continue
        # 每日重启次数限制
        day_start = now() - 86400
        count = query('SELECT COUNT(*) c FROM guardian_logs WHERE guardian_id=? AND ts>?',
                      (g['id'], day_start), one=True)['c']
        if count >= int(g.get('max_restarts') or 10):
            continue
        run_cmd(g['cmd'], timeout=30, shell=True)
        execute('INSERT INTO guardian_logs (guardian_id,ts,action) VALUES (?,?,?)',
                (g['id'], now(), 'restart'))
        execute('UPDATE guardians SET last_restart=? WHERE id=?', (now(), g['id']))
        restarted += 1
    return restarted


@router.post('/add')
def guardian_add(body: dict, request: Request, user: dict = Depends(require_perm('processes:kill'))):
    name = str(body.get('name', '')).strip()
    process = str(body.get('process', '')).strip()
    cmd = str(body.get('cmd', '')).strip()
    if not name or not process or not cmd:
        raise HTTPException(status_code=400, detail='名称/进程标识/启动命令不能为空')
    gid = execute(
        'INSERT INTO guardians (name,process,cmd,max_restarts,enabled,created_at) '
        'VALUES (?,?,?,?,1,?)',
        (name, process, cmd, int(body.get('max_restarts', 10)), now()))
    audit(user['username'], get_client_ip(request), 'guardian_add',
          f'添加进程守护 [{name}] → {cmd}')
    return {'id': gid}


@router.put('/{gid}')
def guardian_update(gid: int, body: dict, request: Request,
                    user: dict = Depends(require_perm('processes:kill'))):
    g = query('SELECT * FROM guardians WHERE id=?', (gid,), one=True)
    if not g:
        raise HTTPException(status_code=404, detail='守护项不存在')
    fields = {k: body[k] for k in ('name', 'process', 'cmd', 'max_restarts', 'enabled')
              if k in body}
    sets = ', '.join(f'{k}=?' for k in fields)
    execute(f'UPDATE guardians SET {sets} WHERE id=?', [*fields.values(), gid])
    return {'ok': True}


@router.delete('/{gid}')
def guardian_delete(gid: int, request: Request,
                    user: dict = Depends(require_perm('processes:kill'))):
    execute('DELETE FROM guardians WHERE id=?', (gid,))
    execute('DELETE FROM guardian_logs WHERE guardian_id=?', (gid,))
    audit(user['username'], get_client_ip(request), 'guardian_delete', f'删除守护 #{gid}', 'warning')
    return {'ok': True}


@router.post('/{gid}/check')
def guardian_check(gid: int, user: dict = Depends(require_perm('processes:view'))):
    g = query('SELECT * FROM guardians WHERE id=?', (gid,), one=True)
    if not g:
        raise HTTPException(status_code=404, detail='守护项不存在')
    running = _is_running(g['process'])
    return {'running': running, 'name': g['name']}


@router.get('/{gid}/logs')
def guardian_logs(gid: int, limit: int = 50, user: dict = Depends(require_perm('processes:view'))):
    return {'list': query('SELECT * FROM guardian_logs WHERE guardian_id=? '
                          'ORDER BY id DESC LIMIT ?', (gid, limit))}
