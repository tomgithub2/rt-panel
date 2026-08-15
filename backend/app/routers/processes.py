# Created by 小杜 on 2026/08

"""进程管理：查看/结束/优先级调整。"""
import os

import psutil
from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm

router = APIRouter(prefix='/api/processes', tags=['processes'])


@router.get('/{pid}')
def proc_detail(pid: int, user: dict = Depends(require_perm('processes:view'))):
    try:
        p = psutil.Process(pid)
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail='进程不存在')
    info = p.as_dict(attrs=['pid', 'name', 'username', 'status', 'cpu_percent',
                            'memory_percent', 'memory_info', 'create_time',
                            'num_threads', 'exe', 'cmdline', 'cwd', 'nice',
                            'open_files', 'connections', 'environ'])
    info['open_files'] = [f.path for f in (info.get('open_files') or [])][:100]
    info['connections'] = [
        {'laddr': f'{c.laddr.ip}:{c.laddr.port}' if c.laddr else '',
         'raddr': f'{c.raddr.ip}:{c.raddr.port}' if c.raddr else '',
         'status': c.status} for c in (info.get('connections') or [])][:100]
    if 'environ' in info and info['environ']:
        info['environ'] = {k: v for k, v in info['environ'].items()
                           if not any(s in k.upper() for s in ('PASSWORD', 'SECRET', 'KEY', 'TOKEN'))}
    return info


@router.post('/kill')
def kill(body: dict, request: Request, user: dict = Depends(require_perm('processes:kill'))):
    pid = int(body.get('pid', 0))
    force = bool(body.get('force', False))
    try:
        p = psutil.Process(pid)
        name = p.name()
        if force or os.name == 'nt':
            p.kill()
        else:
            p.terminate()
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail='进程不存在')
    except psutil.AccessDenied:
        raise HTTPException(status_code=403, detail='权限不足，无法结束该进程')
    audit(user['username'], get_client_ip(request), 'process_kill',
          f'结束进程 {name}({pid}) force={force}', 'warning')
    return {'ok': True}


@router.post('/priority')
def priority(body: dict, request: Request, user: dict = Depends(require_perm('processes:kill'))):
    pid = int(body.get('pid', 0))
    nice = int(body.get('nice', 0))
    try:
        p = psutil.Process(pid)
        if os.name == 'nt':
            p.nice(nice)  # Windows: 进程优先级类
        else:
            p.nice(nice)
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail='进程不存在')
    except psutil.AccessDenied:
        raise HTTPException(status_code=403, detail='权限不足')
    audit(user['username'], get_client_ip(request), 'process_priority',
          f'调整进程 {pid} 优先级 nice={nice}')
    return {'ok': True}
