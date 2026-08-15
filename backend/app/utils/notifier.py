"""通知渠道：邮件 / Webhook / 钉钉 / 企业微信 / 飞书。"""
import json
import smtplib
import urllib.request
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr

from ..database import query

CHANNELS = ['email', 'webhook', 'dingtalk', 'wecom', 'feishu']


def _cfg(channel: str) -> dict:
    row = query('SELECT config FROM notifications WHERE channel=?', (channel,), one=True)
    if not row:
        return {}
    try:
        return json.loads(row['config'])
    except Exception:
        return {}


def get_channels() -> list:
    out = []
    for ch in CHANNELS:
        row = query('SELECT enabled, config FROM notifications WHERE channel=?',
                    (ch,), one=True)
        out.append({'channel': ch, 'enabled': bool(row['enabled']) if row else False,
                    'config': json.loads(row['config']) if row and row['config'] else {}})
    return out


def send(title: str, content: str, only: list = None) -> dict:
    """向所有启用（或指定）的渠道发送告警。"""
    results = {}
    for ch in CHANNELS:
        if only and ch not in only:
            continue
        row = query('SELECT enabled FROM notifications WHERE channel=?', (ch,), one=True)
        if not row or not row['enabled']:
            continue
        cfg = _cfg(ch)
        try:
            if ch == 'email':
                results[ch] = _send_email(cfg, title, content)
            elif ch == 'webhook':
                results[ch] = _send_webhook(cfg, title, content)
            elif ch == 'dingtalk':
                results[ch] = _send_dingtalk(cfg, title, content)
            elif ch == 'wecom':
                results[ch] = _send_wecom(cfg, title, content)
            elif ch == 'feishu':
                results[ch] = _send_feishu(cfg, title, content)
        except Exception as e:
            results[ch] = {'ok': False, 'error': str(e)}
    return results


def _send_email(cfg: dict, title: str, content: str) -> dict:
    host = cfg.get('host', '')
    port = int(cfg.get('port', 465))
    user = cfg.get('user', '')
    password = cfg.get('password', '')
    to = cfg.get('to', '')
    ssl = bool(cfg.get('ssl', True))
    if not all([host, user, password, to]):
        return {'ok': False, 'error': '邮件配置不完整'}
    msg = MIMEText(content, 'plain', 'utf-8')
    msg['Subject'] = Header(title, 'utf-8')
    msg['From'] = formataddr(('RT面板', user))
    msg['To'] = to
    if ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=15)
    else:
        server = smtplib.SMTP(host, port, timeout=15)
    try:
        server.login(user, password)
        server.sendmail(user, to.split(','), msg.as_string())
    finally:
        server.quit()
    return {'ok': True}


def _http_post(url: str, payload: dict, headers: dict = None, timeout: int = 10) -> dict:
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data,
                                 headers={'Content-Type': 'application/json',
                                          **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode('utf-8', 'ignore')
    return {'ok': True, 'body': body}


def _send_webhook(cfg: dict, title: str, content: str) -> dict:
    url = cfg.get('url', '')
    if not url:
        return {'ok': False, 'error': 'URL 未配置'}
    return _http_post(url, {'title': title, 'content': content},
                      cfg.get('headers') or {})


def _send_dingtalk(cfg: dict, title: str, content: str) -> dict:
    token = cfg.get('token', '')
    secret = cfg.get('secret', '')
    if not token:
        return {'ok': False, 'error': 'access_token 未配置'}
    if secret:
        import hashlib
        import hmac
        import time
        import base64
        ts = str(round(time.time() * 1000))
        sign_str = f'{ts}\n{secret}'
        h = hmac.new(secret.encode(), sign_str.encode(), hashlib.sha256).digest()
        sign = base64.b64encode(h).decode()
        url = f'https://oapi.dingtalk.com/robot/send?access_token={token}&timestamp={ts}&sign={sign}'
    else:
        url = f'https://oapi.dingtalk.com/robot/send?access_token={token}'
    payload = {'msgtype': 'markdown',
               'markdown': {'title': title, 'text': f'### {title}\n\n{content}'}}
    return _http_post(url, payload)


def _send_wecom(cfg: dict, title: str, content: str) -> dict:
    key = cfg.get('key', '')
    if not key:
        return {'ok': False, 'error': '机器人 key 未配置'}
    url = f'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={key}'
    payload = {'msgtype': 'markdown', 'markdown': {'content': f'**{title}**\n{content}'}}
    return _http_post(url, payload)


def _send_feishu(cfg: dict, title: str, content: str) -> dict:
    url = cfg.get('url', '')
    if not url:
        return {'ok': False, 'error': '飞书 webhook URL 未配置'}
    payload = {'msg_type': 'text', 'content': {'text': f'{title}\n{content}'}}
    return _http_post(url, payload)
