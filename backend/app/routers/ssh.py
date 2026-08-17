# Created by 小杜 on 2026/08

"""SSH 管理：sshd_config 解析、就地修改与安全加固（自研）。"""
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/ssh', tags=['ssh'])

SSHD_CONFIG = '/etc/ssh/sshd_config'

_PARSE_KEYS = ('Port', 'PermitRootLogin', 'PasswordAuthentication',
               'PubkeyAuthentication', 'ListenAddress')


def _read_sshd_config() -> str:
    try:
        with open(SSHD_CONFIG, 'r', encoding='utf-8', errors='replace') as fh:
            return fh.read()
    except Exception:
        return ''


def _parse_sshd(text: str) -> dict:
    """解析生效（未注释）的配置项。"""
    raw = {}
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        m = re.match(r'^([A-Za-z][A-Za-z0-9]*)\s+(.*)$', s)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if key in _PARSE_KEYS:
            raw[key] = val
    port = raw.get('Port', '22')
    try:
        port = int(port)
    except (TypeError, ValueError):
        port = 22
    return {
        'port': port,
        'permit_root': raw.get('PermitRootLogin', 'yes'),
        'password_auth': raw.get('PasswordAuthentication', 'yes'),
        'pubkey_auth': raw.get('PubkeyAuthentication', 'yes'),
        'listen_address': raw.get('ListenAddress', '0.0.0.0'),
    }


def _service_status() -> str:
    for svc in ('ssh', 'sshd'):
        r = run_cmd(['systemctl', 'is-active', svc], timeout=10, shell=False)
        if r['code'] == 0:
            return r['stdout'].strip()
    return 'inactive'


def _restart_ssh() -> bool:
    for svc in ('ssh', 'sshd'):
        r = run_cmd(['systemctl', 'restart', svc], timeout=60, shell=False)
        if r['code'] == 0:
            return True
    return False


@router.get('/status')
def ssh_status(user: dict = Depends(require_perm('ssh:view'))):
    return ssh_status_core()


def ssh_status_core() -> dict:
    """SSH 状态核心（AI 智能体与路由共用）。"""
    if IS_WIN:
        return {'supported': False, 'service': 'unsupported', 'config': {},
                'message': 'Windows 暂不支持 SSH 管理'}
    text = _read_sshd_config()
    if not text:
        return {'supported': True, 'service': _service_status(), 'config': {},
                'error': '无法读取 /etc/ssh/sshd_config（可能未安装 OpenSSH）'}
    return {'supported': True, 'service': _service_status(), 'config': _parse_sshd(text)}


@router.put('/config')
def ssh_config_update(body: dict, request: Request,
                      user: dict = Depends(require_perm('ssh:manage'))):
    if IS_WIN:
        raise HTTPException(status_code=400, detail='Windows 暂不支持 SSH 管理')
    if not os.path.isfile(SSHD_CONFIG):
        raise HTTPException(status_code=400, detail='未找到 /etc/ssh/sshd_config（请先安装 OpenSSH）')
    try:
        port = int(body.get('port', 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail='端口无效')
    if port < 22 or port > 65535:
        raise HTTPException(status_code=400, detail='端口需在 22-65535 之间')

    def _yn(key: str) -> str:
        v = str(body.get(key, 'yes')).strip().lower()
        if v not in ('yes', 'no'):
            raise HTTPException(status_code=400, detail=f'{key} 仅支持 yes/no')
        return v

    permit_root = _yn('permit_root')
    password_auth = _yn('password_auth')
    pubkey_auth = _yn('pubkey_auth')

    # 先备份，失败即止
    bak = SSHD_CONFIG + '.rtbak'
    try:
        import shutil
        shutil.copy2(SSHD_CONFIG, bak)
    except Exception:
        raise HTTPException(status_code=400, detail='备份 sshd_config 失败（需 root 权限）')

    # 纯 Python 改写：去掉旧键值行（含注释），再按规范值追加，全程不走 shell
    changes = (('Port', str(port)), ('PermitRootLogin', permit_root),
               ('PasswordAuthentication', password_auth), ('PubkeyAuthentication', pubkey_auth))
    change_keys = {k for k, _ in changes}
    try:
        with open(SSHD_CONFIG, 'r', encoding='utf-8', errors='replace') as fh:
            lines = fh.read().splitlines()
        kept = []
        for ln in lines:
            m = re.match(r'^\s*#?\s*([A-Za-z][A-Za-z0-9]*)\s+', ln)
            if m and m.group(1) in change_keys:
                continue
            kept.append(ln)
        for key, val in changes:
            kept.append(f'{key} {val}')
        with open(SSHD_CONFIG, 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(kept) + '\n')
    except Exception as e:
        try:
            shutil.copy2(bak, SSHD_CONFIG)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f'改写 sshd_config 失败，已回滚: {e}')

    # sshd -t 校验；失败则恢复备份并 400
    import shutil as _shutil
    sshd_bin = _shutil.which('sshd') or '/usr/sbin/sshd'
    t = run_cmd([sshd_bin, '-t'], timeout=30, shell=False)
    if t['code'] != 0:
        try:
            shutil.copy2(bak, SSHD_CONFIG)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail='配置校验失败，已自动回滚：'
                            + ((t['stderr'] or t['stdout']) or '')[:200])

    restarted = _restart_ssh()
    audit(user['username'], get_client_ip(request), 'ssh_config',
          f'修改 SSH 配置：端口 {port}，Root登录 {permit_root}，'
          f'密码认证 {password_auth}，公钥认证 {pubkey_auth}', 'warning')
    if restarted:
        return {'ok': True, 'message': '已重启 SSH 服务', 'restarted': True}
    return {'ok': True, 'restarted': False,
            'message': '配置已保存并通过校验，但 SSH 服务重启失败，请手动重启'}


@router.get('/hardening')
def ssh_hardening(user: dict = Depends(require_perm('ssh:view'))):
    if IS_WIN:
        return {'supported': False, 'list': []}
    text = _read_sshd_config()
    cfg = _parse_sshd(text) if text else {
        'port': 22, 'permit_root': 'yes', 'password_auth': 'yes',
        'pubkey_auth': 'yes', 'listen_address': '0.0.0.0'}
    checks = []

    pr = str(cfg['permit_root']).lower()
    if pr == 'no':
        checks.append({'key': 'root_login', 'title': '禁止 Root 登录', 'status': 'ok',
                       'desc': 'PermitRootLogin=no', 'suggest': ''})
    elif pr in ('prohibit-password', 'without-password'):
        checks.append({'key': 'root_login', 'title': 'Root 仅密钥登录', 'status': 'ok',
                       'desc': f'PermitRootLogin={cfg["permit_root"]}', 'suggest': ''})
    else:
        checks.append({'key': 'root_login', 'title': 'Root 允许密码登录', 'status': 'danger',
                       'desc': f'PermitRootLogin={cfg["permit_root"]}',
                       'suggest': '建议设为 no 或 prohibit-password'})

    pa = str(cfg['password_auth']).lower()
    if pa == 'no':
        checks.append({'key': 'password_auth', 'title': '已关闭密码登录', 'status': 'ok',
                       'desc': '仅允许密钥登录，更安全', 'suggest': ''})
    else:
        checks.append({'key': 'password_auth', 'title': '开启密码登录', 'status': 'warn',
                       'desc': '存在暴力破解风险', 'suggest': '建议关闭并改用密钥登录'})

    pk = str(cfg['pubkey_auth']).lower()
    if pk == 'yes':
        checks.append({'key': 'pubkey_auth', 'title': '已启用公钥认证', 'status': 'ok',
                       'desc': '支持密钥登录', 'suggest': ''})
    else:
        checks.append({'key': 'pubkey_auth', 'title': '未启用公钥认证', 'status': 'warn',
                       'desc': '无法使用密钥登录', 'suggest': '建议开启公钥认证'})

    if cfg['port'] == 22:
        checks.append({'key': 'port', 'title': '使用默认端口 22', 'status': 'warn',
                       'desc': '易被端口扫描与爆破', 'suggest': '建议改为 10000-65535 间非常用端口'})
    else:
        checks.append({'key': 'port', 'title': '使用非默认端口', 'status': 'ok',
                       'desc': f'当前端口 {cfg["port"]}', 'suggest': ''})

    fb_installed = run_cmd('command -v fail2ban-client >/dev/null 2>&1',
                           timeout=10, shell=True)['code'] == 0
    if fb_installed:
        fb_active = run_cmd('systemctl is-active fail2ban 2>/dev/null',
                            timeout=10, shell=True)['stdout'].strip() == 'active'
        if fb_active:
            checks.append({'key': 'fail2ban', 'title': 'fail2ban 已启用', 'status': 'ok',
                           'desc': '自动封禁爆破来源 IP', 'suggest': ''})
        else:
            checks.append({'key': 'fail2ban', 'title': 'fail2ban 未运行', 'status': 'warn',
                           'desc': '已安装但服务未启动', 'suggest': '执行 systemctl enable --now fail2ban'})
    else:
        checks.append({'key': 'fail2ban', 'title': '未安装 fail2ban', 'status': 'info',
                       'desc': '缺少爆破防护', 'suggest': '建议安装 fail2ban 防 SSH 爆破'})

    la = str(cfg['listen_address']).strip()
    if la in ('0.0.0.0', '::', ''):
        checks.append({'key': 'listen_address', 'title': '监听所有地址', 'status': 'info',
                       'desc': f'ListenAddress={la or "默认"}',
                       'suggest': '若仅内网使用，可限制监听来源 IP'})
    else:
        checks.append({'key': 'listen_address', 'title': '已限制监听地址', 'status': 'ok',
                       'desc': f'ListenAddress={la}', 'suggest': ''})

    return {'supported': True, 'list': checks}
