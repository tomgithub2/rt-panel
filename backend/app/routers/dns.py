"""DNS 工具：hosts 解析管理、resolv.conf / 系统 DNS 查看、缓存刷新。"""
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_perm
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/dns', tags=['dns'])


def _hosts_path() -> str:
    if IS_WIN:
        return os.path.join(os.environ.get('SystemRoot', r'C:\Windows'),
                            'System32', 'drivers', 'etc', 'hosts')
    return '/etc/hosts'


def _valid_ip(ip: str) -> bool:
    if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', ip):
        return all(0 <= int(x) <= 255 for x in ip.split('.'))
    if ':' in ip and re.match(r'^[0-9a-fA-F:]+$', ip):
        return True
    return False


def _parse_hosts(text: str) -> list:
    out = []
    for line in text.splitlines():
        s = line.strip().lstrip('\ufeff')  # 去除 Windows hosts 的 UTF-8 BOM
        if not s or s.startswith('#'):
            continue
        m = re.match(r'^(\S+)\s+(\S+)(.*)$', s)
        if not m:
            continue
        ip, domain, rest = m.groups()
        comment = ''
        cm = re.search(r'#\s*(.*)$', rest)
        if cm:
            comment = cm.group(1).strip()
        out.append({'ip': ip, 'domain': domain, 'comment': comment})
    return out


@router.get('/hosts')
def get_hosts(user: dict = Depends(require_perm('dns:view'))):
    return read_hosts_core()


def read_hosts_core() -> dict:
    """读取 hosts（AI 智能体与路由共用）。"""
    path = _hosts_path()
    if not os.path.isfile(path):
        return {'list': [], 'raw': '', 'path': path, 'error': 'hosts 文件不存在：' + path}
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            raw = f.read()
    except Exception as e:
        return {'list': [], 'raw': '', 'path': path, 'error': '读取失败：' + str(e)}
    return {'list': _parse_hosts(raw), 'raw': raw, 'path': path}


@router.put('/hosts')
def put_hosts(body: dict, request: Request, user: dict = Depends(require_perm('dns:manage'))):
    entries = body.get('entries', [])
    path = _hosts_path()
    if not isinstance(entries, list) or len(entries) > 10000:
        raise HTTPException(status_code=400, detail='条目无效')
    lines = []
    for e in entries:
        ip = str(e.get('ip', '')).strip()
        domain = str(e.get('domain', '')).strip()
        comment = str(e.get('comment', '')).strip().replace('#', '').replace('\n', ' ').replace('\r', ' ')[:100]
        if not _valid_ip(ip):
            raise HTTPException(status_code=400, detail='IP 无效：' + ip)
        if not re.match(r'^[a-zA-Z0-9\.\-\_]+$', domain) or len(domain) > 255:
            raise HTTPException(status_code=400, detail='域名无效：' + domain)
        line = f'{ip}\t{domain}'
        if comment:
            line += f'\t# {comment}'
        lines.append(line)
    content = '\n'.join(lines) + ('\n' if lines else '')
    # 备份原文件
    try:
        import shutil
        shutil.copy2(path, path + '.rtbak')
    except Exception:
        pass
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    except PermissionError:
        raise HTTPException(status_code=500, detail='写入失败：需要管理员权限')
    audit(user['username'], get_client_ip(request), 'dns_hosts',
          f'修改 hosts（{len(lines)} 条）', 'warning')
    return {'ok': True, 'count': len(lines)}


@router.get('/resolv')
def get_resolv(user: dict = Depends(require_perm('dns:view'))):
    if IS_WIN:
        r = run_cmd('powershell -NoProfile -Command "Get-DnsClientServerAddress -AddressFamily IPv4 | '
                    'Select-Object InterfaceAlias,ServerAddresses | ConvertTo-Json -Compress"', timeout=30)
        import json
        servers = []
        try:
            data = json.loads(r['stdout'])
            if isinstance(data, dict):
                data = [data]
            for d in data:
                addrs = d.get('ServerAddresses')
                if isinstance(addrs, str):
                    addrs = [addrs]
                elif not isinstance(addrs, list):
                    addrs = []
                for a in addrs:
                    if a and a not in servers:
                        servers.append(str(a))
        except Exception:
            pass
        return {'win': True, 'raw': r['stdout'], 'nameservers': servers}
    path = '/etc/resolv.conf'
    if not os.path.isfile(path):
        return {'raw': '', 'nameservers': [], 'error': 'resolv.conf 不存在'}
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            raw = f.read()
    except Exception as e:
        return {'raw': '', 'nameservers': [], 'error': str(e)}
    servers = []
    for line in raw.splitlines():
        s = line.strip()
        if s.startswith('nameserver'):
            parts = s.split()
            if len(parts) > 1 and parts[1] not in servers:
                servers.append(parts[1])
    return {'raw': raw, 'nameservers': servers}


@router.post('/flush')
def flush_dns(request: Request, user: dict = Depends(require_perm('dns:manage'))):
    ok, output = flush_dns_core()
    if not ok:
        raise HTTPException(status_code=500, detail=output[:200])
    audit(user['username'], get_client_ip(request), 'dns_flush', '刷新 DNS 缓存', 'info')
    return {'ok': True, 'output': output[-500:]}


def flush_dns_core() -> tuple:
    """刷新 DNS 缓存核心（AI 智能体与路由共用）；返回 (成功, 输出)。"""
    if IS_WIN:
        cmd = 'ipconfig /flushdns'
    else:
        cmd = ('systemctl restart systemd-resolved 2>/dev/null || '
               'systemctl restart nscd 2>/dev/null || '
               '/etc/init.d/dns-clean start 2>/dev/null || true')
    r = run_cmd(cmd, timeout=60, shell=True)
    if IS_WIN and r['code'] != 0:
        return False, (r['stderr'] or '刷新失败')
    return True, (r['stdout'] + r['stderr'])[-500:]
