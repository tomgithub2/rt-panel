"""审计日志与登录日志写入。"""
from .database import execute, now


def audit(user: str = '', ip: str = '', action: str = '', detail: str = '',
          level: str = 'info'):
    try:
        execute(
            'INSERT INTO audit_logs (ts, user, ip, action, detail, level) VALUES (?,?,?,?,?,?)',
            (now(), user, ip, action, detail, level))
    except Exception:
        pass


def login_log(username: str, ip: str, ua: str, success: bool, reason: str = ''):
    try:
        execute(
            'INSERT INTO login_logs (ts, username, ip, ua, success, reason) VALUES (?,?,?,?,?,?)',
            (now(), username, ip, ua, 1 if success else 0, reason))
    except Exception:
        pass
