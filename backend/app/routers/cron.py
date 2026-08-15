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
    for j in jobs:
        j['next_runs'] = next_runs(j['schedule'], 3)
    return {'list': jobs}


@router.post('/add')
def cron_add(body: dict, request: Request, user: dict = Depends(require_perm('cron:manage'))):
    name = str(body.get('name', '')).strip()
    schedule = str(body.get('schedule', '')).strip()
    command = str(body.get('command', '')).strip()
    # 宝塔式：URL 任务（定时访问网址，如监控保活/触发钩子）
    if body.get('type') == 'url':
        if not command.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail='URL 任务地址需以 http(s):// 开头')
        command = f'curl -fsS --max-time 60 "{command}"'
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
