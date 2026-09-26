# Created by 小杜 on 2026/09
"""面板 ↔ 官网 动态验证码（32 位、大小写+数字、每 30 秒轮换）。

用途：面板向官网发起请求（如代发提醒邮件）时不使用长期固定凭据，而是用
"绑定阶段下发的共享密钥 + 当前 30 秒窗口"派生出的一次性动态码；
官网校验允许 ±1 窗口（容忍时钟偏移），并按窗口号**防重放**。

算法（两端必须完全一致）：
    window = int(unix_ts) // 30
    digest = HMAC_SHA256(secret, str(window).encode()).digest()
    按 digest 字节流做拒绝采样（丢弃 >=248 的字节，保证 62 字符均匀），取 32 位
"""
import hashlib
import hmac
import secrets

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
STEP = 30
LENGTH = 32


def new_secret() -> str:
    """下发/保存用的共享密钥（64 位 hex）。"""
    return secrets.token_hex(32)


def window_of(ts: float) -> int:
    return int(ts) // STEP


def code_for(secret: str, ts: float = None) -> str:
    """按共享密钥与当前窗口生成 32 位动态码。"""
    import time
    ts = time.time() if ts is None else ts
    win = window_of(ts)
    return code_for_window(secret, win)


def code_for_window(secret: str, window: int) -> str:
    digest = hmac.new(str(secret).encode(), str(window).encode(), hashlib.sha256).digest()
    out = []
    i = 0
    while len(out) < LENGTH:
        b = digest[i % len(digest)]
        i += 1
        if b >= 248:
            continue
        out.append(ALPHABET[b % len(ALPHABET)])
    return "".join(out)


def check(secret: str, code: str, ts: float = None, tolerance: int = 1) -> int:
    """校验动态码，返回命中的窗口号；不匹配返回 0。

    注意：调用方还应比对窗口号防止重放（同一窗口只允许用一次）。
    """
    code = str(code or "").strip()
    if len(code) != LENGTH or not secret:
        return 0
    win = window_of(ts if ts is not None else __import__("time").time())
    for delta in range(-tolerance, tolerance + 1):
        w = win + delta
        if hmac.compare_digest(code_for_window(secret, w), code):
            return w
    return 0
