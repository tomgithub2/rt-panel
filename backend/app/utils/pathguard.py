# Created by 小杜 on 2026/08

"""敏感路径守卫（工单 P-01）。

背景：文件管理 / 日志 tail 这类接口原先只做 `normpath`，任何有读权限的账号都能
`?path=<DATA_DIR>/secret.key` 读到 JWT 签名密钥 → 伪造管理员令牌 → root 终端。
这里提供统一入口，所有文件类接口都必须过 `assert_allowed()`。
"""
import os

from fastapi import HTTPException

from ..config import BACKUP_DIR, DATA_DIR, LOG_DIR

# 绝对禁止通过文件接口访问的目录（面板自身的数据/备份：密钥、库、绑定、配置都在里面）
SENSITIVE_DIRS = (DATA_DIR, BACKUP_DIR)

# 例外：面板自身日志允许查看（否则日志页的 tail 功能失效）
ALLOWED_DIRS = (LOG_DIR,)

# 即使不在敏感目录内，这些系统文件也不允许通过面板读写
SENSITIVE_PATHS = (
    '/etc/shadow', '/etc/gshadow', '/etc/sudoers', '/etc/sudoers.d',
    '/root/.ssh', '/proc', '/sys',
)


def _rp(path: object) -> str:
    return os.path.realpath(os.path.abspath(str(path or '').strip()))


def _inside(child: str, parent: str) -> bool:
    child, parent = _rp(child), _rp(parent)
    try:
        return os.path.commonpath([child, parent]) == parent
    except ValueError:      # 不同盘符等
        return False


def assert_allowed(path: object) -> str:
    """校验并返回 realpath；命中受保护路径抛 403。"""
    rp = _rp(path)
    if not rp:
        raise HTTPException(status_code=400, detail='路径为空')
    for allowed in ALLOWED_DIRS:
        if _inside(rp, allowed):
            return rp
    for root in SENSITIVE_DIRS:
        if _inside(rp, root):
            raise HTTPException(status_code=403, detail='该路径受保护（面板数据目录），禁止通过文件接口访问')
    for item in SENSITIVE_PATHS:
        if _inside(rp, item) or os.path.normcase(rp) == os.path.normcase(_rp(item)):
            raise HTTPException(status_code=403, detail='该路径受保护，禁止通过文件接口访问')
    return rp


def is_sensitive(path: object) -> bool:
    """只判断不抛异常（列表过滤等场景用）。"""
    try:
        assert_allowed(path)
        return False
    except HTTPException:
        return True
