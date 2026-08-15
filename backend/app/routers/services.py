# Created by 小杜 on 2026/08

"""服务管理：Windows 服务 / systemd 单元。"""
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/services', tags=['services'])


@router.get('/list')
def service_list(user: dict = Depends(require_perm('services:view'))):
    if IS_WIN:
        return _win_list()
    return _linux_list()


def _win_list():
    r = run_cmd('powershell -NoProfile -Command "Get-Service | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json -Compress"',
                timeout=60)
    if r['code'] != 0:
        return {'list': [], 'error': r['stderr'][:300]}
    import json
    try:
        data = json.loads(r['stdout'])
    except Exception:
        return {'list': [], 'error': '解析服务列表失败'}
    if isinstance(data, dict):
        data = [data]
    mapping = {'Stopped': 'stopped', 'Running': 'running', 'Paused': 'paused'}
    out = []
    for s in data:
        out.append({
            'name': s.get('Name', ''),
            'display': s.get('DisplayName', ''),
            'status': mapping.get(s.get('Status', ''), s.get('Status', '')),
            'start_type': s.get('StartType', ''),
            'type': 'win',
        })
    return {'list': out}


def _linux_list():
    r = run_cmd("systemctl list-units --type=service --all --no-pager --no-legend --plain "
                "2>/dev/null | awk '{print $1\"|\"$3\"|\"$4\"|\"substr($0, index($0,$5))}'",
                timeout=60, shell=True)
    if r['code'] != 0:
        return {'list': [], 'error': 'systemd 不可用'}
    out = []
    for line in r['stdout'].splitlines():
        parts = line.split('|', 3)
        if len(parts) < 4:
            continue
        name, load, active, desc = parts
        if not name.endswith('.service'):
            continue
        out.append({
            'name': name,
            'display': desc.strip(),
            'status': active.strip(),
            'load': load.strip(),
            'start_type': _unit_enabled(name),
            'type': 'systemd',
        })
    return {'list': out}


def _unit_enabled(name: str) -> str:
    r = run_cmd(f'systemctl is-enabled {name} 2>/dev/null', timeout=10, shell=True)
    return r['stdout'].strip() if r['code'] == 0 else 'disabled'


@router.post('/action')
def service_action(body: dict, request: Request,
                   user: dict = Depends(require_perm('services:manage'))):
    name = str(body.get('name', ''))
    action = str(body.get('action', ''))
    if not name or action not in ('start', 'stop', 'restart', 'reload', 'enable', 'disable'):
        raise HTTPException(status_code=400, detail='参数无效')
    if IS_WIN:
        cmd = f'powershell -NoProfile -Command "{{ $s = Get-Service -Name \'{name}\' -ErrorAction Stop; '
        if action == 'start':
            cmd += "$s | Start-Service"
        elif action == 'stop':
            cmd += "$s | Stop-Service"
        elif action == 'restart':
            cmd += "$s | Restart-Service"
        else:
            cmd += f"Set-Service -Name '{name}' -StartupType " + \
                   ('Automatic' if action == 'enable' else 'Disabled')
        cmd += '"'
    else:
        cmd = f'systemctl {action} {name}'
    r = run_cmd(cmd, timeout=120, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or r['stdout'])[:300] or '执行失败')
    audit(user['username'], get_client_ip(request), 'service_action',
          f'{action} 服务 {name}', 'warning' if action in ('stop', 'disable') else 'info')
    return {'ok': True}


@router.get('/status/{name}')
def service_status(name: str, user: dict = Depends(require_perm('services:view'))):
    if IS_WIN:
        r = run_cmd(f'powershell -NoProfile -Command "Get-Service -Name \'{name}\' | '
                    'Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json"',
                    timeout=30, shell=True)
        return {'raw': r['stdout'] if r['code'] == 0 else r['stderr']}
    r = run_cmd(f'systemctl status {name} --no-pager 2>&1 | head -n 40', timeout=30, shell=True)
    return {'raw': r['stdout']}
