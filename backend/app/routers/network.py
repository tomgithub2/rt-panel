# Created by 小杜 on 2026/08

"""网络工具：网卡、路由、ping、traceroute、DNS、端口探测。"""
import re
import socket

import psutil
from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_perm
from ..utils.exec_utils import IS_WIN, run_cmd, which

router = APIRouter(prefix='/api/network', tags=['network'])

_HOST_RE = re.compile(r'^[A-Za-z0-9][A-Za-z0-9.:-]{0,252}$')


def _safe_host(value: object) -> str:
    host = str(value or '').strip()
    if not _HOST_RE.fullmatch(host):
        raise HTTPException(status_code=400, detail='主机名或 IP 格式无效')
    return host


@router.get('/interfaces')
def interfaces(user: dict = Depends(require_perm('network:view'))):
    from ..utils.sysinfo import net_info
    return net_info()


@router.get('/routes')
def routes(user: dict = Depends(require_perm('network:view'))):
    if IS_WIN:
        r = run_cmd('route print -4', timeout=30)
        return {'raw': r['stdout'], 'list': _parse_win_routes(r['stdout'])}
    r = run_cmd('ip route', timeout=10)
    return {'raw': r['stdout'], 'list': []}


def _parse_win_routes(text: str):
    out = []
    started = False
    for line in text.splitlines():
        if 'IPv4 Route Table' in line or '活动路由' in line:
            started = True
            continue
        if started and line.strip():
            parts = line.split()
            if len(parts) >= 5 and parts[0].count('.') == 3:
                out.append({'dest': parts[0], 'mask': parts[1], 'gateway': parts[2],
                            'iface': parts[3], 'metric': parts[4]})
    return out[:100]


@router.get('/arp')
def arp(user: dict = Depends(require_perm('network:view'))):
    if IS_WIN:
        r = run_cmd('arp -a', timeout=30)
        return {'raw': r['stdout']}
    r = run_cmd('ip neigh', timeout=10)
    return {'raw': r['stdout']}


@router.post('/ping')
def ping(body: dict, user: dict = Depends(require_perm('network:tools'))):
    host = _safe_host(body.get('host', ''))
    count = int(body.get('count', 4))
    if not 1 <= count <= 20:
        raise HTTPException(status_code=400, detail='参数无效')
    if IS_WIN:
        cmd = ['ping', '-n', str(count), '-w', '2000', host]
    else:
        cmd = ['ping', '-c', str(count), '-W', '2', host]
    r = run_cmd(cmd, timeout=count * 5 + 10, shell=False)
    return {'code': r['code'], 'output': r['stdout'] + r['stderr']}


@router.post('/traceroute')
def traceroute(body: dict, user: dict = Depends(require_perm('network:tools'))):
    host = _safe_host(body.get('host', ''))
    if IS_WIN:
        cmd = ['tracert', '-d', '-h', '15', '-w', '1500', host]
    else:
        cmd = (['traceroute', '-n', '-m', '15', '-w', '2', host]
               if which('traceroute') else ['tracepath', host])
    r = run_cmd(cmd, timeout=60, shell=False)
    return {'code': r['code'], 'output': r['stdout'] + r['stderr']}


@router.post('/dns')
def dns_query(body: dict, user: dict = Depends(require_perm('network:tools'))):
    domain = str(body.get('domain', '')).strip()
    if not domain:
        raise HTTPException(status_code=400, detail='域名不能为空')
    out = []
    try:
        for info in socket.getaddrinfo(domain, None):
            addr = info[4][0]
            if addr not in [x['address'] for x in out]:
                out.append({'family': str(info[0]), 'address': addr})
    except socket.gaierror as e:
        return {'ok': False, 'error': str(e), 'list': []}
    return {'ok': True, 'list': out}


@router.post('/port-check')
def port_check(body: dict, user: dict = Depends(require_perm('network:tools'))):
    host = str(body.get('host', '')).strip()
    port = int(body.get('port', 0))
    timeout = float(body.get('timeout', 3))
    if not host or not 0 < port < 65536:
        raise HTTPException(status_code=400, detail='参数无效')
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    import time
    t0 = time.time()
    try:
        result = s.connect_ex((host, port))
        elapsed = round((time.time() - t0) * 1000, 1)
        s.close()
        return {'open': result == 0, 'port': port, 'host': host, 'elapsed_ms': elapsed}
    except Exception as e:
        s.close()
        return {'open': False, 'error': str(e)}


@router.post('/scan')
def port_scan(body: dict, user: dict = Depends(require_perm('network:tools'))):
    """对主机扫描指定端口范围（并发探测）。"""
    host = str(body.get('host', '')).strip()
    start = int(body.get('start', 1))
    end = int(body.get('end', 1024))
    if not host or end - start > 5000:
        raise HTTPException(status_code=400, detail='参数无效（范围过大）')
    import concurrent.futures

    def check(p):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.8)
        try:
            if s.connect_ex((host, p)) == 0:
                return p
        except Exception:
            pass
        finally:
            s.close()
        return None

    open_ports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=200) as ex:
        for p in ex.map(check, range(start, end + 1)):
            if p:
                open_ports.append(p)
    return {'host': host, 'open_ports': sorted(open_ports)}


@router.get('/connections')
def connections(user: dict = Depends(require_perm('network:view'))):
    counter = {}
    for conn in psutil.net_connections(kind='inet'):
        if not conn.raddr:
            continue
        key = f'{conn.raddr.ip}:{conn.raddr.port}'
        counter[key] = counter.get(key, 0) + 1
    top = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:60]
    return {'total': sum(counter.values()),
            'list': [{'endpoint': k, 'count': v} for k, v in top]}
