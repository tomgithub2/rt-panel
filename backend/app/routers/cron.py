# Created by 小杜 on 2026/08

"""计划任务管理（面板内置调度，跨平台一致）。"""
from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm
from ..database import execute, now, query
from ..scheduler import next_runs, run_job

router = APIRouter(prefix='/api/cron', tags=['cron'])


@router.get('/list')
def cron_list(user: dict = Depends(require_perm('cron:view'))):
    jobs = query('SELECT * FROM cron_jobs ORDER BY id DESC')
    # P-25g：只有 cron:manage 才看得到 root 命令与上次输出（只读访客看得到等于情报泄露）
    from ..rbac import role_permissions
    can_manage = user['role'] == 'admin' or 'cron:manage' in role_permissions(user['role'])
    for j in jobs:
        j['next_runs'] = next_runs(j['schedule'], 3)
        if not can_manage:
            j.pop('command', None)
            j.pop('last_output', None)
    return {'list': jobs, 'can_manage': can_manage}


@router.post('/add')
def cron_add(body: dict, request: Request, user: dict = Depends(require_perm('cron:manage'))):
    name = str(body.get('name', '')).strip()
    schedule = str(body.get('schedule', '')).strip()
    command = str(body.get('command', '')).strip()
    # URL 任务（定时访问网址，如监控保活/触发钩子）
    if body.get('type') == 'url':
        # P-25a：不要把 URL 拼成 shell 字符串再交给 shell=True 执行 ——
        # `http://x/$(id>/tmp/pwned)` 会落库并由调度器以 root 定时执行（持久化后门）。
        # 这里只做 scheme/host 校验并把 URL 原样存库（带 url: 标记），执行时用 argv。
        from urllib.parse import urlparse as _urlparse
        parsed = _urlparse(command)
        if parsed.scheme not in ('http', 'https') or not parsed.netloc:
            raise HTTPException(status_code=400, detail='URL 任务地址需为完整的 http(s) 地址')
        if any(ch.isspace() for ch in command) or any(ch in command for ch in (';', '|', '&', '$', '`', '\n', '\r')):
            raise HTTPException(status_code=400, detail='URL 任务地址包含非法字符')
        command = 'url:' + command
    if not name or not schedule or not command:
        raise HTTPException(status_code=400, detail='名称/计划/命令不能为空')
    runs = next_runs(schedule, 1)
    if not runs:
        raise HTTPException(status_code=400, detail='计划表达式无效')
    jid = execute(
        'INSERT INTO cron_jobs (name,schedule,command,enabled,notify,timeout,created_at) '
        'VALUES (?,?,?,?,?,?,?)',
        (name, schedule, command, 1 if body.get('enabled', True) else 0,
         1 if body.get('notify', False) else 0, int(body.get('timeout', 3600)), now()))
    audit(user['username'], get_client_ip(request), 'cron_add', f'添加计划任务 [{name}] {schedule}')
    return {'id': jid, 'next_runs': runs}


@router.put('/{jid}')
def cron_update(jid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('cron:manage'))):
    job = query('SELECT * FROM cron_jobs WHERE id=?', (jid,), one=True)
    if not job:
        raise HTTPException(status_code=404, detail='任务不存在')
    fields = {k: body[k] for k in ('name', 'schedule', 'command', 'enabled', 'notify', 'timeout')
              if k in body}
    if 'schedule' in fields and not next_runs(fields['schedule'], 1):
        raise HTTPException(status_code=400, detail='计划表达式无效')
    sets = ', '.join(f'{k}=?' for k in fields)
    execute(f'UPDATE cron_jobs SET {sets} WHERE id=?', [*fields.values(), jid])
    audit(user['username'], get_client_ip(request), 'cron_update', f'修改计划任务 [{job["name"]}]')
    return {'ok': True}


@router.delete('/{jid}')
def cron_delete(jid: int, request: Request, user: dict = Depends(require_perm('cron:manage'))):
    job = query('SELECT * FROM cron_jobs WHERE id=?', (jid,), one=True)
    if not job:
        raise HTTPException(status_code=404, detail='任务不存在')
    execute('DELETE FROM cron_jobs WHERE id=?', (jid,))
    execute('DELETE FROM cron_runs WHERE job_id=?', (jid,))
    audit(user['username'], get_client_ip(request), 'cron_delete', f'删除计划任务 [{job["name"]}]', 'warning')
    return {'ok': True}


@router.post('/{jid}/run')
def cron_run_now(jid: int, request: Request, user: dict = Depends(require_perm('cron:manage'))):
    job = query('SELECT * FROM cron_jobs WHERE id=?', (jid,), one=True)
    if not job:
        raise HTTPException(status_code=404, detail='任务不存在')
    audit(user['username'], get_client_ip(request), 'cron_run_now', f'手动执行计划任务 [{job["name"]}]')
    return run_job(jid)


@router.post('/{jid}/toggle')
def cron_toggle(jid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('cron:manage'))):
    execute('UPDATE cron_jobs SET enabled=? WHERE id=?',
            (1 if body.get('enabled') else 0, jid))
    return {'ok': True}


@router.get('/{jid}/runs')
def cron_runs(jid: int, limit: int = 50, user: dict = Depends(require_perm('cron:view'))):
    return {'list': query('SELECT * FROM cron_runs WHERE job_id=? ORDER BY id DESC LIMIT ?',
                          (jid, limit))}


@router.post('/validate')
def cron_validate(body: dict, user: dict = Depends(require_perm('cron:view'))):
    schedule = str(body.get('schedule', '')).strip()
    runs = next_runs(schedule, 5)
    return {'valid': bool(runs), 'next_runs': runs}
