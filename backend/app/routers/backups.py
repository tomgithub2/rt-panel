# Created by 小杜 on 2026/08

"""备份管理：备份任务 CRUD、立即执行、文件列表、恢复。"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..config import BACKUP_DIR
from ..database import execute, now, query
from ..scheduler import next_runs, run_backup

router = APIRouter(prefix='/api/backups', tags=['backups'],
                   dependencies=[Depends(require_feature('backups'))])


@router.get('/tasks')
def tasks(user: dict = Depends(require_perm('backups:view'))):
    rows = query('SELECT * FROM backup_tasks ORDER BY id DESC')
    for t in rows:
        t['next_runs'] = next_runs(t['schedule'], 2) if t['schedule'] else []
    return {'list': rows}


@router.post('/tasks')
def add_task(body: dict, request: Request, user: dict = Depends(require_perm('backups:manage'))):
    name = str(body.get('name', '')).strip()
    btype = str(body.get('type', ''))
    source = str(body.get('source', '')).strip()
    if not name or btype not in ('dir', 'db') or not source:
        raise HTTPException(status_code=400, detail='参数不完整')
    if btype == 'dir' and not os.path.isdir(source):
        raise HTTPException(status_code=400, detail='源目录不存在')
    schedule = str(body.get('schedule', '@daily'))
    if schedule and not schedule.startswith('@every') and not next_runs(schedule, 1):
        raise HTTPException(status_code=400, detail='计划表达式无效')
    tid = execute(
        'INSERT INTO backup_tasks (name,type,source,dest,schedule,keep,enabled,notify,exclude,created_at) '
        'VALUES (?,?,?,?,?,?,?,?,?,?)',
        (name, btype, source, BACKUP_DIR, schedule, int(body.get('keep', 7)),
         1 if body.get('enabled', True) else 0, 1 if body.get('notify', False) else 0,
         str(body.get('exclude', '')), now()))
    audit(user['username'], get_client_ip(request), 'backup_add', f'添加备份任务 [{name}]')
    return {'id': tid}


@router.put('/tasks/{tid}')
def update_task(tid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('backups:manage'))):
    task = query('SELECT * FROM backup_tasks WHERE id=?', (tid,), one=True)
    if not task:
        raise HTTPException(status_code=404, detail='任务不存在')
    fields = {k: body[k] for k in ('name', 'schedule', 'keep', 'enabled', 'notify', 'exclude')
              if k in body}
    sets = ', '.join(f'{k}=?' for k in fields)
    execute(f'UPDATE backup_tasks SET {sets} WHERE id=?', [*fields.values(), tid])
    audit(user['username'], get_client_ip(request), 'backup_update', f'修改备份任务 [{task["name"]}]')
    return {'ok': True}


@router.delete('/tasks/{tid}')
def delete_task(tid: int, request: Request, user: dict = Depends(require_perm('backups:manage'))):
    task = query('SELECT * FROM backup_tasks WHERE id=?', (tid,), one=True)
    if not task:
        raise HTTPException(status_code=404, detail='任务不存在')
    execute('DELETE FROM backup_tasks WHERE id=?', (tid,))
    audit(user['username'], get_client_ip(request), 'backup_delete',
          f'删除备份任务 [{task["name"]}]', 'warning')
    return {'ok': True}


@router.post('/tasks/{tid}/run')
def run_now(tid: int, request: Request, user: dict = Depends(require_perm('backups:manage'))):
    task = query('SELECT * FROM backup_tasks WHERE id=?', (tid,), one=True)
    if not task:
        raise HTTPException(status_code=404, detail='任务不存在')
    audit(user['username'], get_client_ip(request), 'backup_run', f'手动执行备份 [{task["name"]}]')
    return run_backup(tid)


@router.get('/files')
def files(user: dict = Depends(require_perm('backups:view'))):
    out = []
    if not os.path.isdir(BACKUP_DIR):
        return {'list': out}
    for root, dirs, fs in os.walk(BACKUP_DIR):
        for f in fs:
            fp = os.path.join(root, f)
            st = os.stat(fp)
            out.append({
                'name': f, 'path': fp, 'size': st.st_size, 'mtime': st.st_mtime,
                'rel': os.path.relpath(fp, BACKUP_DIR),
            })
    out.sort(key=lambda x: x['mtime'], reverse=True)
    return {'list': out, 'total_size': sum(x['size'] for x in out)}


@router.post('/restore')
def restore(body: dict, request: Request, user: dict = Depends(require_perm('backups:manage'))):
    """恢复 zip 备份到目标目录，或恢复 sql.gz 到数据库。"""
    src = body.get('path', '')
    target = str(body.get('target', '')).strip()
    if not src or not os.path.isfile(src):
        raise HTTPException(status_code=400, detail='备份文件不存在')
    if src.endswith('.zip'):
        if not target:
            raise HTTPException(status_code=400, detail='请填写恢复目标目录')
        import shutil
        import zipfile
        os.makedirs(target, exist_ok=True)
        # 复用文件管理的安全解压（防 zip 路径穿越/符号链接）
        from .files import _extract_zip_safely
        _extract_zip_safely(src, target)
        audit(user['username'], get_client_ip(request), 'backup_restore',
              f'恢复 {src} → {target}', 'warning')
        return {'ok': True, 'target': target}
    if src.endswith('.sql.gz'):
        from ..utils.exec_utils import run_cmd
        import re as _re
        db = str(body.get('database', '')).strip()
        if not _re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,63}', db):
            raise HTTPException(status_code=400, detail='目标数据库名无效（仅字母数字下划线，字母开头）')
        if not os.path.isfile(src):
            raise HTTPException(status_code=400, detail='备份文件不存在')
        r = run_cmd(f'gunzip -c "{src}" | mysql -uroot {db}', timeout=3600, shell=True)
        if r['code'] != 0:
            raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '恢复失败')
        audit(user['username'], get_client_ip(request), 'backup_restore',
              f'恢复数据库 {db}', 'warning')
        return {'ok': True, 'target': db}
    raise HTTPException(status_code=400, detail='不支持的备份格式')


@router.delete('/files')
def delete_file(body: dict, request: Request, user: dict = Depends(require_perm('backups:manage'))):
    path = body.get('path', '')
    if not path or not os.path.isfile(path) or not path.startswith(BACKUP_DIR):
        raise HTTPException(status_code=400, detail='无效文件')
    os.remove(path)
    audit(user['username'], get_client_ip(request), 'backup_file_delete', path, 'warning')
    return {'ok': True}
