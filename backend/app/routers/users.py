# Created by 小杜 on 2026/08

"""面板用户与 RBAC 管理。"""
from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, hash_password, password_policy_error, require_perm
from ..database import execute, now, query
from ..rbac import ROLES

router = APIRouter(prefix='/api/users', tags=['users'])


@router.get('/list')
def user_list(user: dict = Depends(require_perm('users:view'))):
    rows = query('SELECT id,username,role,email,remark,status,two_fa,created_at,last_login '
                 'FROM users ORDER BY id')
    return {'list': rows}


@router.get('/roles')
def roles(user: dict = Depends(require_perm('users:view'))):
    return {'roles': [
        {'id': k, 'name': v['name'], 'desc': v['desc'], 'perms': sorted(v['perms'])}
        for k, v in ROLES.items()
    ]}


@router.post('/add')
def user_add(body: dict, request: Request, user: dict = Depends(require_perm('users:manage'))):
    username = str(body.get('username', '')).strip()
    password = str(body.get('password', ''))
    role = str(body.get('role', 'operator'))
    policy_error = password_policy_error(password)
    if not username or policy_error:
        raise HTTPException(status_code=400, detail='用户名不能为空；' + policy_error)
    if not username.replace('_', '').replace('-', '').isalnum():
        raise HTTPException(status_code=400, detail='用户名仅限字母数字下划线')
    if role not in ROLES:
        raise HTTPException(status_code=400, detail='角色无效')
    if query('SELECT id FROM users WHERE username=?', (username,), one=True):
        raise HTTPException(status_code=409, detail='用户名已存在')
    uid = execute(
        'INSERT INTO users (username,password_hash,role,email,remark,status,created_at) '
        'VALUES (?,?,?,?,?,1,?)',
        (username, hash_password(password), role, body.get('email', ''),
         body.get('remark', ''), now()))
    audit(user['username'], get_client_ip(request), 'user_add',
          f'添加用户 {username}（{role}）', 'warning')
    return {'id': uid}


@router.put('/{uid}')
def user_update(uid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('users:manage'))):
    target = query('SELECT * FROM users WHERE id=?', (uid,), one=True)
    if not target:
        raise HTTPException(status_code=404, detail='用户不存在')
    # P-25e：先把类型归一化再判定 —— 原来 `{"status": ""}` 绕过守卫后被下面归一成 0，
    # `{"role": "viewer"}` 也能把唯一管理员降级（两条路都能让面板失去管理员）。
    raw_status = body.get('status', None)
    if raw_status is not None:
        raw_status = 1 if str(raw_status).strip().lower() not in ('0', 'false', 'off', '') else 0
    raw_role = body.get('role', None)
    admin_left = query('SELECT COUNT(*) c FROM users WHERE role="admin" AND status=1',
                       one=True)['c']
    if target['role'] == 'admin' and admin_left <= 1:
        if raw_status == 0:
            raise HTTPException(status_code=400, detail='至少保留一个启用状态的管理员')
        if raw_role is not None and raw_role != 'admin':
            raise HTTPException(status_code=400, detail='不能降级最后一个管理员，请先新增管理员')
    fields = {}
    for k in ('role', 'email', 'remark', 'status'):
        if k in body:
            fields[k] = body[k]
    if 'role' in fields and fields['role'] not in ROLES:
        raise HTTPException(status_code=400, detail='角色无效')
    if 'status' in fields:
        fields['status'] = 1 if fields['status'] else 0
    if fields:
        sets = ', '.join(f'{k}=?' for k in fields)
        execute(f'UPDATE users SET {sets} WHERE id=?', [*fields.values(), uid])
    audit(user['username'], get_client_ip(request), 'user_update',
          f'修改用户 {target["username"]} {fields}', 'warning')
    return {'ok': True}


@router.post('/{uid}/password')
def user_password(uid: int, body: dict, request: Request,
                  user: dict = Depends(require_perm('users:manage'))):
    password = str(body.get('password', ''))
    policy_error = password_policy_error(password)
    if policy_error:
        raise HTTPException(status_code=400, detail=policy_error)
    # P-14：管理员重置密码后，被重置用户的旧令牌立即失效
    from ..auth import bump_token_epoch
    bump_token_epoch(uid)
    execute('UPDATE users SET password_hash=? WHERE id=?', (hash_password(password), uid))
    audit(user['username'], get_client_ip(request), 'user_password',
          f'重置用户 #{uid} 的密码', 'warning')
    return {'ok': True}


@router.delete('/{uid}')
def user_delete(uid: int, request: Request, user: dict = Depends(require_perm('users:manage'))):
    target = query('SELECT * FROM users WHERE id=?', (uid,), one=True)
    if not target:
        raise HTTPException(status_code=404, detail='用户不存在')
    if target['id'] == user['id']:
        raise HTTPException(status_code=400, detail='不能删除当前登录用户')
    if target['role'] == 'admin' and \
            query('SELECT COUNT(*) c FROM users WHERE role="admin"', one=True)['c'] <= 1:
        raise HTTPException(status_code=400, detail='至少保留一个管理员')
    execute('DELETE FROM users WHERE id=?', (uid,))
    audit(user['username'], get_client_ip(request), 'user_delete',
          f'删除用户 {target["username"]}', 'warning')
    return {'ok': True}
