# Created by 小杜 on 2026/09
"""通过官网代发提醒邮件（动态验证码认证）。

面板不保存任何"长期发信凭据"：用绑定阶段官网下发的 `rolling_secret` 与当前 30 秒窗口
派生出 32 位动态码（见 .rolling），随请求提交；官网校验 ±1 窗口并按窗口防重放。
"""
import json
import urllib.error
import urllib.request

from . import rolling
from .binding import _load, server_url


_skew_cache = {'ts': 0.0, 'offset': 0.0}


def _server_offset() -> float:
    """官网与本机的时间差（秒）。动态码按 30 秒窗口派生，两端时钟不一致会直接 401，
    而机房服务器常有几十秒漂移，因此这里主动对齐（缓存 10 分钟）。"""
    import time as _t
    if _t.time() - _skew_cache['ts'] < 600:
        return _skew_cache['offset']
    off = 0.0
    try:
        t0 = _t.time()
        with urllib.request.urlopen(server_url().rstrip('/') + '/api/health', timeout=10) as r:
            import json as _j
            sts = float(_j.loads(r.read().decode('utf-8', 'ignore')).get('ts') or 0)
        t1 = _t.time()
        if sts:
            off = sts - (t0 + t1) / 2
    except Exception:
        off = 0.0
    _skew_cache.update(ts=_t.time(), offset=off)
    return off


def rolling_code(secret: str) -> str:
    """按**官网时间**生成当前窗口的动态码（自动补偿时钟偏差）。"""
    import time as _t
    return rolling.code_for(secret, ts=_t.time() + _server_offset())

def send_via_site(subject: str, content: str, timeout: int = 20) -> dict:
    """请官网代发一封提醒邮件（收件人固定为官网账号本人邮箱）。"""
    data = _load() or {}
    secret = str(data.get('rolling_secret') or '')
    mid = str(data.get('machine_id') or '')
    bid = str(data.get('binding_id') or '')
    if not (secret and mid and bid):
        return {'ok': False, 'error': '未取得动态密钥，请先在面板执行一次官网校验'}
    payload = {
        'machine_id': mid,
        'binding_id': bid,
        'rolling': rolling_code(secret),   # 32 位、30 秒轮换（已按官网时间对齐）
        'subject': str(subject or '')[:150],
        'body': str(content or '')[:5000],
    }
    req = urllib.request.Request(
        server_url().rstrip('/') + '/api/v1/mail/send',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            out = json.loads(resp.read().decode('utf-8', 'ignore') or '{}')
        return out if isinstance(out, dict) else {'ok': True}
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode('utf-8', 'ignore')).get('detail', '')
        except Exception:
            detail = ''
        return {'ok': False, 'error': detail or f'官网返回 {e.code}'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def _call(path: str, payload: dict, timeout: int = 20) -> dict:
    """带动态验证码调用官网接口（内部复用）。"""
    data = _load() or {}
    secret = str(data.get('rolling_secret') or '')
    mid = str(data.get('machine_id') or '')
    bid = str(data.get('binding_id') or '')
    if not (secret and mid and bid):
        return {'ok': False, 'error': '未取得动态密钥，请先在面板执行一次官网校验'}
    body = dict(payload or {})
    body.update({'machine_id': mid, 'binding_id': bid, 'rolling': rolling_code(secret)})
    req = urllib.request.Request(server_url().rstrip('/') + path,
                                 data=json.dumps(body).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            out = json.loads(resp.read().decode('utf-8', 'ignore') or '{}')
        return out if isinstance(out, dict) else {'ok': True}
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read().decode('utf-8', 'ignore')).get('detail', '')
        except Exception:
            detail = ''
        return {'ok': False, 'error': detail or f'官网返回 {e.code}'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def set_notify_email(to: str) -> dict:
    """填写提醒接收邮箱（官网会给该邮箱发确认码）。"""
    to = str(to or '').strip().lower()
    if not to or '@' not in to:
        return {'ok': False, 'error': '请填写正确的邮箱地址'}
    return _call('/api/v1/mail/set', {'to': to})


def confirm_notify_email(code: str) -> dict:
    """提交邮件里的 6 位确认码。"""
    return _call('/api/v1/mail/confirm', {'confirm_code': str(code or '').strip()})

def notify_status() -> dict:
    """向官网查询代发状态（收件邮箱是否已填写并确认）。"""
    r = _call('/api/v1/mail/status', {}, timeout=15)
    if not r.get('ok'):
        return {'bound': False, 'error': r.get('error') or '未获取到状态'}
    return {'bound': True, 'to': r.get('to', ''), 'verified': bool(r.get('verified')),
            'mode': 'site'}
