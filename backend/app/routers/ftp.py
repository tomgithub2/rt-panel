"""FTP 管理：vsftpd 检测 + FTP 用户管理（自研）。"""
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm
from ..database import execute, now, query
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/ftp', tags=['ftp'])

USERNAME_RE = re.compile(r'^[a-z0-9_]{3,20}$')


def _vsftpd_check() -> tuple:
    """检测 vsftpd：返回 (是否已安装, 版本信息)。"""
    r = run_cmd('vsftpd -version 2>&1', timeout=10, shell=True)
    return r['code'] == 0, (r['stdout'] or r['stderr']).strip()


@router.get('/status')
def ftp_status(user: dict = Depends(require_perm('ftp:view'))):
    users_count = query('SELECT COUNT(*) c FROM ftp_users', one=True)['c']
    if IS_WIN:
        return {'installed': False, 'supported': False, 'version': '',
                'users_count': users_count,
                'message': 'Windows 暂不支持 vsftpd，请使用 Linux 系统'}
    installed, version = _vsftpd_check()
    return {
        'installed': installed,
        'supported': True,
        'version': version[:100],
        'users_count': users_count,
        'message': '' if installed else 'vsftpd 未安装，请在软件商店安装 FTP',
    }


@router.get('/users')
def ftp_users(user: dict = Depends(require_perm('ftp:view'))):
    return {'list': query('SELECT * FROM ftp_users ORDER BY id DESC')}


@router.post('/users')
def ftp_user_add(body: dict, request: Request, user: dict = Depends(require_perm('ftp:manage'))):
    username = str(body.get('username', '')).strip()
    directory = str(body.get('dir', '')).strip()
    password = str(body.get('password', ''))
    note = str(body.get('note', ''))[:100]
    r = ftp_create_core(username, directory, password, note)
    if not r.get('ok'):
        raise HTTPException(status_code=400, detail=r.get('error', '创建失败'))
    audit(user['username'], get_client_ip(request), 'ftp_user_add',
          f'创建 FTP 用户 {username}（目录 {directory}）', 'warning')
    return r


def ftp_create_core(username: str, directory: str, password: str,
                    note: str = '') -> dict:
    """创建 FTP 用户核心逻辑（AI 智能体与路由共用）。"""
    username = str(username).strip()
    directory = str(directory).strip()
    password = str(password)
    if not USERNAME_RE.match(username):
        return {'ok': False, 'error': '用户名需为 3-20 位小写字母/数字/下划线'}
    if not directory:
        return {'ok': False, 'error': '目录不能为空'}
    if not password:
        return {'ok': False, 'error': '密码不能为空'}
    if IS_WIN:
        return {'ok': False, 'error': 'Windows 暂不支持 FTP 用户管理'}
    installed, _ = _vsftpd_check()
    if not installed:
        return {'ok': False, 'error': '请在软件商店安装 FTP'}
    if query('SELECT id FROM ftp_users WHERE username=?', (username,), one=True):
        return {'ok': False, 'error': '用户已存在'}
    run_cmd(['useradd', '-m', '-d', directory, '-s', '/sbin/nologin', username],
            timeout=30)
    r = run_cmd('chpasswd', input_text=f'{username}:{password}\n', timeout=30)
    if r['code'] != 0:
        return {'ok': False, 'error': '设置密码失败：' + (r['stderr'] or '')[:200]}
    uid = execute('INSERT INTO ftp_users (username, dir, note, created_at) VALUES (?,?,?,?)',
                  (username, directory, note, now()))
    return {'ok': True, 'id': uid}


@router.delete('/users/{uid}')
def ftp_user_del(uid: int, request: Request, user: dict = Depends(require_perm('ftp:manage'))):
    row = query('SELECT * FROM ftp_users WHERE id=?', (uid,), one=True)
    if not row:
        raise HTTPException(status_code=404, detail='用户不存在')
    username = row['username']
    execute('DELETE FROM ftp_users WHERE id=?', (uid,))
    # 仅删除系统用户；不加 -r，避免误删其 FTP 目录文件（符合「不删目录文件」要求）
    if not IS_WIN:
        run_cmd(['userdel', username], timeout=30)
    audit(user['username'], get_client_ip(request), 'ftp_user_del',
          f'删除 FTP 用户 {username}（保留目录文件）', 'warning')
    return {'ok': True}
