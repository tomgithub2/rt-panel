"""日志管理：系统日志、面板审计日志、文件 tail。"""
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from ..auth import require_perm
from ..config import DATA_DIR, LOG_DIR
from ..database import query
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/logs', tags=['logs'])


@router.get('/sources')
def sources(user: dict = Depends(require_perm('logs:view'))):
    out = [
        {'name': '面板审计日志', 'key': 'audit', 'type': 'panel'},
        {'name': '登录日志', 'key': 'login', 'type': 'panel'},
        {'name': '计划任务执行记录', 'key': 'cron', 'type': 'panel'},
    ]
    if IS_WIN:
        out.append({'name': 'Windows 事件日志 - 系统', 'key': 'win-system', 'type': 'system'})
        out.append({'name': 'Windows 事件日志 - 应用', 'key': 'win-app', 'type': 'system'})
        out.append({'name': 'Windows 事件日志 - 安全', 'key': 'win-security', 'type': 'system'})
    else:
        for name, key in (('系统日志 /var/log/syslog', 'syslog'),
                          ('认证日志 /var/log/auth.log', 'authlog'),
                          ('内核日志 dmesg', 'dmesg'),
                          ('journalctl', 'journal')):
            out.append({'name': name, 'key': key, 'type': 'system'})
    return {'list': out}


@router.get('/read')
def read_log(key: str = 'audit', lines: int = 200, search: str = '',
             user: dict = Depends(require_perm('logs:view'))):
    lines = min(max(lines, 10), 2000)
    if key == 'audit':
        sql = 'SELECT * FROM audit_logs'
        params = []
        if search:
            sql += ' WHERE action LIKE ? OR detail LIKE ? OR user LIKE ?'
            params = [f'%{search}%'] * 3
        rows = query(sql + ' ORDER BY id DESC LIMIT ?', [*params, lines])
        return {'type': 'table', 'cols': ['时间', '用户', 'IP', '动作', '详情', '级别'],
                'rows': [{'ts': r['ts'], 'user': r['user'], 'ip': r['ip'],
                          'action': r['action'], 'detail': r['detail'], 'level': r['level']}
                         for r in rows]}
    if key == 'login':
        rows = query('SELECT * FROM login_logs ORDER BY id DESC LIMIT ?', (lines,))
        return {'type': 'table', 'cols': ['时间', '用户名', 'IP', '浏览器', '结果', '原因'],
                'rows': [{'ts': r['ts'], 'user': r['username'], 'ip': r['ip'],
                          'ua': r['ua'], 'ok': r['success'], 'reason': r['reason']} for r in rows]}
    if key == 'cron':
        rows = query('SELECT r.*, j.name AS job_name FROM cron_runs r '
                     'LEFT JOIN cron_jobs j ON j.id=r.job_id ORDER BY r.id DESC LIMIT ?', (lines,))
        return {'type': 'table', 'cols': ['时间', '任务', '退出码', '耗时(s)', '输出'],
                'rows': [{'ts': r['ts'], 'job': r['job_name'], 'code': r['exit_code'],
                          'duration': r['duration'], 'output': (r['output'] or '')[:300]} for r in rows]}
    if key == 'win-system':
        r = run_cmd('powershell -NoProfile -Command "Get-WinEvent -LogName System -MaxEvents 100 | '
                    'Select-Object TimeCreated,Id,LevelDisplayName,Message | ConvertTo-Json -Compress"',
                    timeout=60)
        return {'type': 'raw', 'content': r['stdout'] if r['code'] == 0 else r['stderr']}
    if key == 'win-app':
        r = run_cmd('powershell -NoProfile -Command "Get-WinEvent -LogName Application -MaxEvents 100 | '
                    'Select-Object TimeCreated,Id,LevelDisplayName,Message | ConvertTo-Json -Compress"',
                    timeout=60)
        return {'type': 'raw', 'content': r['stdout'] if r['code'] == 0 else r['stderr']}
    if key == 'win-security':
        r = run_cmd('powershell -NoProfile -Command "Get-WinEvent -LogName Security -MaxEvents 100 | '
                    'Select-Object TimeCreated,Id,LevelDisplayName,Message | ConvertTo-Json -Compress"',
                    timeout=60)
        return {'type': 'raw', 'content': r['stdout'] if r['code'] == 0 else r['stderr']}
    if key == 'syslog':
        return _tail_file('/var/log/syslog', lines)
    if key == 'authlog':
        return _tail_file('/var/log/auth.log', lines)
    if key == 'dmesg':
        r = run_cmd('dmesg | tail -n 200', timeout=30, shell=True)
        return {'type': 'raw', 'content': r['stdout']}
    if key == 'journal':
        r = run_cmd('journalctl -n 200 --no-pager 2>&1', timeout=30, shell=True)
        return {'type': 'raw', 'content': r['stdout']}
    raise HTTPException(status_code=404, detail='未知日志源')


def _tail_file(path: str, lines: int):
    if not os.path.isfile(path):
        return {'type': 'raw', 'content': f'文件不存在: {path}'}
    r = run_cmd(f'tail -n {lines} {path}', timeout=20, shell=True)
    return {'type': 'raw', 'content': r['stdout'] if r['code'] == 0 else r['stderr']}


@router.get('/tail')
def tail_file(path: str, lines: int = 100,
              user: dict = Depends(require_perm('logs:view'))):
    """任意日志文件 tail（复用文件管理权限语义）。"""
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail='文件不存在')
    r = run_cmd(f'tail -n {min(lines, 2000)} "{path}"', timeout=20, shell=True)
    return {'content': r['stdout'], 'path': path}


@router.delete('/audit')
def clear_audit(user: dict = Depends(require_perm('logs:clear'))):
    from ..database import execute
    execute('DELETE FROM audit_logs')
    return {'ok': True}
