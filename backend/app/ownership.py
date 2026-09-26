# Created by 小杜 on 2026/09
"""P-25h：资源归属过滤（owner）。

原来 `websites` / `ftp_users` / `ssl_certs` / `cron_jobs` / `docker_containers` 都**没有 owner 列**，
任何具备 view/manage 权限的用户都能看到并改动**别人**建的资源（多用户面板上是越权）。

约定（保持向后兼容）：
  · admin 不过滤；
  · 新资源写入 owner_id = 创建者；
  · **owner_id 为空的历史资源**对所有有权限者仍可见可操作（升级后行为不突变）。
"""
from fastapi import HTTPException


def is_admin(user: dict) -> bool:
    return (user or {}).get('role') == 'admin'


def owner_where(user: dict, alias: str = '') -> tuple:
    """返回 (SQL 条件片段, 参数列表)，用于 list 查询的 WHERE。"""
    if is_admin(user):
        return '1=1', []
    col = f'{alias}owner_id' if alias else 'owner_id'
    return f'({col} IS NULL OR {col}=?)', [(user or {}).get('id')]


def can_touch(user: dict, row) -> bool:
    if is_admin(user):
        return True
    oid = row.get('owner_id') if isinstance(row, dict) else None
    return oid is None or oid == (user or {}).get('id')


def assert_touch(user: dict, row, what: str = '该资源'):
    if not can_touch(user, row):
        raise HTTPException(status_code=403, detail=f'无权操作{what}：它属于其他用户')
