"""网站管理：静态站点 / 反向代理，生成 Nginx 或 Caddy 配置。"""
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..config import WWWROOT_DIR
from ..database import execute, now, query
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/websites', tags=['websites'],
                   dependencies=[Depends(require_feature('websites'))])


def _find_engine() -> str:
    for name, cmd in (('nginx', 'nginx -v 2>&1'), ('caddy', 'caddy version'),
                      ('apache', 'httpd -v 2>&1 || apache2 -v 2>&1')):
        r = run_cmd(cmd, timeout=10, shell=True)
        if r['code'] == 0 or 'nginx' in (r['stderr'] + r['stdout']).lower():
            if name == 'nginx':
                return 'nginx'
            return name if r['code'] == 0 else ''
    return ''


def _nginx_log_path(logtype: str) -> str:
    """定位 Nginx 访问/错误日志文件（跨平台）。"""
    fname = f'{logtype}.log'
    if IS_WIN:
        roots = [r'C:\Tengine\logs', r'C:\nginx\logs',
                 os.path.join(os.environ.get('ProgramFiles', r'C:\Program Files'), 'Tengine', 'logs'),
                 os.path.join(os.environ.get('ProgramFiles', r'C:\Program Files'), 'nginx', 'logs')]
        for d in roots:
            p = os.path.join(d, fname)
            if os.path.isfile(p):
                return p
        return os.path.join(roots[0], fname)
    return f'/var/log/nginx/{fname}'


def _tail_file(path: str, n: int) -> str:
    """自研文件尾部读取：seek 到末尾按块倒读，避免加载超大日志。"""
    try:
        with open(path, 'rb') as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            if size == 0:
                return ''
            block = 8192
            data = b''
            pos = size
            while pos > 0 and data.count(b'\n') < n:
                step = min(block, pos)
                pos -= step
                f.seek(pos)
                data = f.read(step) + data
            return data.decode('utf-8', 'ignore')
    except Exception:
        return ''


@router.get('/list')
def site_list(user: dict = Depends(require_perm('websites:view'))):
    wzList = query('SELECT * FROM websites ORDER BY id DESC')
    for oneSite in wzList:
        oneSite['running'] = _site_running(oneSite)
    return {'list': wzList, 'engine': _find_engine()}


def _site_running(site: dict) -> bool:
    if site['engine'] == 'nginx' and site['type'] == 'static':
        # 拿 nginx -T 全文 grep 判断站点在不在跑，土但好用
        # return bool(os.popen('pgrep nginx').read())  # 已弃用（换机器误报），保留参考
        checkRst = run_cmd(f'nginx -T 2>/dev/null | grep -q "server_name {site["domain"]};"',
                           timeout=20, shell=True)
        return checkRst['code'] == 0
    return False


@router.get('/env')
def site_env(user: dict = Depends(require_perm('websites:view'))):
    """建站环境检测：MySQL/FTP 是否可用（不可用则前端禁用对应一键创建选项）。"""
    from .databases import _mysql_cmd
    mysql_ok = run_cmd(_mysql_cmd('-e "SELECT VERSION();"'), timeout=10)['code'] == 0
    ftp_ok = run_cmd('vsftpd -version 2>&1', timeout=10, shell=True)['code'] == 0
    nginx_ok = run_cmd('nginx -v 2>&1', timeout=10, shell=True)['code'] == 0
    return {'mysql': mysql_ok, 'ftp': ftp_ok, 'nginx': nginx_ok,
            'mysql_msg': '' if mysql_ok else '未安装 MySQL，请先在「软件商店」安装后可勾选',
            'ftp_msg': '' if ftp_ok else '未安装 FTP 服务，请先在「软件商店」安装后可勾选',
            'nginx_msg': '' if nginx_ok else '未检测到 Nginx，网站配置将无法生效'}


@router.post('/create')
def site_create(body: dict, request: Request, user: dict = Depends(require_perm('websites:manage'))):
    domain = str(body.get('domain', '')).strip().lower()
    stype = str(body.get('type', 'static'))
    engine = str(body.get('engine', 'nginx'))
    port = int(body.get('port', 80))
    root = str(body.get('root', '')).strip()
    if not re.match(r'^[a-z0-9\.\-\*]+$', domain):
        raise HTTPException(status_code=400, detail='域名无效')
    if query('SELECT id FROM websites WHERE domain=?', (domain,), one=True):
        raise HTTPException(status_code=409, detail='该域名已存在')
    if not root:
        root = os.path.join(WWWROOT_DIR, domain)
    os.makedirs(root, exist_ok=True)
    # 静态站点生成默认首页
    index = os.path.join(root, 'index.html')
    if not os.path.isfile(index):
        with open(index, 'w', encoding='utf-8') as f:
            f.write(f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<title>{domain}</title>
<style>body{{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui;background:#0f1420;color:#dfe6f5}}h1{{font-weight:500}}
span{{color:#409eff}}</style></head><body><h1>欢迎访问 <span>{domain}</span></h1>
<p style="position:fixed;bottom:16px;color:#5b6b85">由 RT面板 运维面板托管</p></body></html>''')
    target = str(body.get('target', '')).strip()
    if stype == 'proxy' and not target:
        raise HTTPException(status_code=400, detail='反向代理需要填写目标地址')
    # 一键建站（超越宝塔）：可选同时创建同名 MySQL 数据库 + FTP 账号
    db_info = None
    if body.get('with_db'):
        db_info = _auto_create_db(domain, body.get('db_name', ''))
    ftp_info = None
    if body.get('with_ftp'):
        ftp_info = _auto_create_ftp(domain, root, body.get('ftp_user', ''))
    sid = execute(
        'INSERT INTO websites (domain,root,port,type,engine,config,status,created_at) '
        'VALUES (?,?,?,?,?,?,?,?)',
        (domain, root, port, stype, engine,
         target if stype == 'proxy' else '', 0, now()))
    _render_nginx()
    audit(user['username'], get_client_ip(request), 'website_create', f'创建网站 {domain} ({stype})')
    return {'id': sid, 'db': db_info, 'ftp': ftp_info}


def _auto_create_db(domain: str, db_name: str = '') -> dict:
    """随建站自动创建同名 MySQL 数据库与账号；MySQL 不可用则返回错误说明。"""
    from .databases import _mysql_cmd
    import secrets as _secrets
    if db_name:
        dbname = re.sub(r'[^a-z0-9_]', '_', db_name.lower())[:40].strip('_')
    else:
        dbname = 'db_' + re.sub(r'[^a-z0-9_]', '_', domain)[:40].strip('_')
    if not dbname:
        dbname = 'db_' + re.sub(r'[^a-z0-9_]', '_', domain)[:40].strip('_')
    dbuser = dbname[:10] + '_' + _secrets.token_hex(2)
    dbpass = _secrets.token_hex(8)
    r = run_cmd(_mysql_cmd('-e "SELECT VERSION();"'), timeout=15)
    if r['code'] != 0:
        return {'ok': False, 'error': '未检测到可用 MySQL（请在「软件商店」安装）'}
    r1 = run_cmd(_mysql_cmd(f'-e "CREATE DATABASE IF NOT EXISTS `{dbname}` DEFAULT CHARACTER SET utf8mb4;"'),
                 timeout=30)
    if r1['code'] != 0:
        return {'ok': False, 'error': (r1['stderr'] or '创建数据库失败')[:200]}
    r2 = run_cmd(_mysql_cmd(
        f'-e "CREATE USER IF NOT EXISTS \'{dbuser}\'@\'localhost\' IDENTIFIED BY \'{dbpass}\';'
        f'GRANT ALL PRIVILEGES ON `{dbname}`.* TO \'{dbuser}\'@\'localhost\';FLUSH PRIVILEGES;"'),
        timeout=30)
    if r2['code'] != 0:
        return {'ok': False, 'error': (r2['stderr'] or '创建数据库账号失败')[:200]}
    return {'ok': True, 'db': dbname, 'user': dbuser, 'password': dbpass,
            'host': 'localhost'}


def _auto_create_ftp(domain: str, root: str, ftp_user: str = '') -> dict:
    """随建站自动创建 FTP 账号（vsftpd 系统用户，目录指向站点根目录）。"""
    import secrets as _secrets
    if IS_WIN:
        return {'ok': False, 'error': 'Windows 暂不支持自动创建 FTP（可在软件商店安装后手动配置）'}
    r = run_cmd('vsftpd -version 2>&1', timeout=10, shell=True)
    if r['code'] != 0 and 'vsftpd' not in (r['stdout'] + r['stderr']).lower():
        return {'ok': False, 'error': '未检测到 vsftpd（请在「软件商店」安装 FTP 服务）'}
    if ftp_user:
        user = re.sub(r'[^a-z0-9_]', '_', ftp_user.lower())[:20].strip('_') or \
            ('ftp_' + re.sub(r'[^a-z0-9_]', '_', domain)[:20].strip('_'))
    else:
        user = 'ftp_' + re.sub(r'[^a-z0-9_]', '_', domain)[:20].strip('_')
    pwd = _secrets.token_hex(6)
    r1 = run_cmd(f'useradd -m -d "{root}" -s /sbin/nologin {user} 2>&1 || true', timeout=20, shell=True)
    r2 = run_cmd(f'echo "{user}:{pwd}" | chpasswd', timeout=20, shell=True)
    if r2['code'] != 0:
        return {'ok': False, 'error': 'FTP 账号创建失败：' + (r2['stderr'] or '')[:150]}
    return {'ok': True, 'user': user, 'password': pwd, 'dir': root}


@router.post('/{sid}/action')
def site_action(sid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('websites:manage'))):
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    action = body.get('action')
    if action == 'toggle':
        execute('UPDATE websites SET status=? WHERE id=?',
                (0 if site['status'] else 1, sid))
        _render_nginx()
        _reload_nginx()
    elif action == 'delete':
        execute('DELETE FROM websites WHERE id=?', (sid,))
        _render_nginx()
        _reload_nginx()
    elif action == 'reload':
        _reload_nginx()
    else:
        raise HTTPException(status_code=400, detail='未知操作')
    audit(user['username'], get_client_ip(request), 'website_action',
          f'{action} 网站 {site["domain"]}', 'warning' if action == 'delete' else 'info')
    return {'ok': True}


@router.put('/{sid}')
def site_update(sid: int, body: dict, request: Request,
                user: dict = Depends(require_perm('websites:manage'))):
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    root = body.get('root', site['root'])
    config = body.get('config', site['config'])
    port = int(body.get('port', site['port']))
    execute('UPDATE websites SET root=?, config=?, port=? WHERE id=?', (root, config, port, sid))
    _render_nginx()
    _reload_nginx()
    audit(user['username'], get_client_ip(request), 'website_update', f'修改网站 {site["domain"]}')
    return {'ok': True}


@router.get('/{sid}')
def site_detail(sid: int, user: dict = Depends(require_perm('websites:view'))):
    """网站详情（二级管理页数据源）。"""
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    site = site or {}  # 双保险：上面已经判过空了，习惯性再兜一下
    st = query('SELECT * FROM site_settings WHERE site_id=?', (sid,), one=True) or {}
    site['settings'] = st
    return {'site': site}
@router.get('/{sid}/config')
def site_config(sid: int, user: dict = Depends(require_perm('websites:view'))):
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    conf = _render_single(site)
    return {'config': conf}
@router.get('/{sid}/logs')
def site_logs(sid: int, type: str = 'access', lines: int = 200,
              user: dict = Depends(require_perm('websites:view'))):
    """网站访问/错误日志查看（Nginx 日志尾部）。"""
    wzRow = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not wzRow:
        raise HTTPException(status_code=404, detail='网站不存在')
    if type not in ('access', 'error'):
        raise HTTPException(status_code=400, detail='日志类型无效（access/error）')
    lines = min(max(int(lines), 1), 2000)
    logPath = _nginx_log_path(type)
    if not os.path.isfile(logPath):
        return {'path': logPath, 'text': '', 'domain': wzRow['domain'],
                'error': '日志文件不存在（Nginx 未安装或未启用访问日志）'}
    rawTxt = _tail_file(logPath, lines)
    tailRows = rawTxt.splitlines()[-lines:]
    return {'path': logPath, 'text': '\n'.join(tailRows),
            'lines': len(tailRows), 'domain': wzRow['domain']}


# ---------------------------------------------------------------- 网站高级设置（伪静态/重定向/密码/防盗链）
# 自研伪静态预设库（常见程序规则，渲染为 Nginx 配置）
PSEUDO_RULES = {
    '': {'name': '无（默认）', 'rules': ''},
    'wordpress': {'name': 'WordPress', 'rules': 'try_files $uri $uri/ /index.php?$args;'},
    'typecho': {'name': 'Typecho', 'rules': "if (!-e $request_filename) {{ rewrite ^(.*)$ /index.php$1 last; }}"},
    'thinkphp': {'name': 'ThinkPHP', 'rules': "if (!-e $request_filename) {{ rewrite ^(.*)$ /index.php?s=$1 last; }}"},
    'laravel': {'name': 'Laravel', 'rules': 'try_files $uri $uri/ /index.php?$query_string;'},
    'discuz': {'name': 'Discuz', 'rules': "rewrite ^([^\\.]*)/topic-(.+)\\.html$ $1/portal.php?mod=topic&topic=$2 last;"},
    'zblog': {'name': 'Z-Blog', 'rules': "if (!-e $request_filename) {{ rewrite ^(.*)$ /index.php$1 last; }}"},
    'empire': {'name': '帝国 CMS', 'rules': "rewrite ^([^\\.]*)/list-([0-9]+)-([0-9]+)\\.html$ $1/e/action/ListInfo/index.php?classid=$2&page=$3 last;"},
    'custom': {'name': '自定义（下方填写）', 'rules': ''},
}


@router.get('/{sid}/settings')
def site_get_settings(sid: int, user: dict = Depends(require_perm('websites:view'))):
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    st = query('SELECT * FROM site_settings WHERE site_id=?', (sid,), one=True) or {}
    return {'settings': st, 'pseudo_presets': [
        {'key': k, 'name': v['name']} for k, v in PSEUDO_RULES.items()]}


@router.put('/{sid}/settings')
def site_put_settings(sid: int, body: dict, request: Request,
                      user: dict = Depends(require_perm('websites:manage'))):
    site = query('SELECT * FROM websites WHERE id=?', (sid,), one=True)
    if not site:
        raise HTTPException(status_code=404, detail='网站不存在')
    pseudo = str(body.get('pseudo', ''))[:20]
    redirect = str(body.get('redirect', '')).strip()[:300]
    auth_user = str(body.get('auth_user', '')).strip()[:50]
    auth_pass = str(body.get('auth_pass', ''))
    hotlink = str(body.get('hotlink', '')).strip()[:300]
    custom_pseudo = str(body.get('custom_pseudo', '')).strip()[:500]
    # 宝塔式：多域名绑定 / 强制 HTTPS / 默认文档
    domains = str(body.get('domains', '')).strip()[:500]
    force_https = 1 if body.get('force_https') else 0
    index_doc = str(body.get('index_doc', '')).strip()[:200]
    if domains:
        for d in domains.replace('\n', ' ').split():
            if not re.match(r'^[a-z0-9\.\-\*]+$', d.strip().lower()):
                raise HTTPException(status_code=400, detail=f'绑定域名无效：{d}')
    if index_doc and not re.match(r'^[a-zA-Z0-9\._ -]+$', index_doc):
        raise HTTPException(status_code=400, detail='默认文档无效')
    if redirect and not redirect.startswith(('http://', 'https://', '/')):
        raise HTTPException(status_code=400, detail='重定向地址需以 http(s):// 或 / 开头')
    auth_hash = ''
    if auth_user and auth_pass:
        r = run_cmd(f'openssl passwd -apr1 "{auth_pass}"', timeout=10, shell=True)
        if r['code'] != 0:
            raise HTTPException(status_code=400, detail='密码加密失败（需安装 openssl）')
        auth_hash = r['stdout'].strip()
        # 写 htpasswd 文件供 auth_basic_user_file 使用
        try:
            os.makedirs('/etc/nginx', exist_ok=True)
            with open(f'/etc/nginx/rt-auth-{sid}', 'w', encoding='utf-8') as f:
                f.write(f'{auth_user}:{auth_hash}\n')
        except Exception:
            pass
    elif auth_user and not auth_pass:
        raise HTTPException(status_code=400, detail='请设置目录密码')
    existing = query('SELECT site_id FROM site_settings WHERE site_id=?', (sid,), one=True)
    if existing:
        execute('UPDATE site_settings SET pseudo=?, redirect=?, auth_user=?, auth_hash=?, hotlink=?, '
                'domains=?, force_https=?, index_doc=? WHERE site_id=?',
                (pseudo, redirect, auth_user, auth_hash, hotlink, domains, force_https, index_doc, sid))
    else:
        execute('INSERT INTO site_settings (site_id, pseudo, redirect, auth_user, auth_hash, hotlink, '
                'domains, force_https, index_doc) VALUES (?,?,?,?,?,?,?,?,?)',
                (sid, pseudo, redirect, auth_user, auth_hash, hotlink, domains, force_https, index_doc))
    if pseudo == 'custom':
        execute('UPDATE site_settings SET pseudo=? WHERE site_id=?',
                ('custom::' + custom_pseudo, sid))
    _render_nginx()
    _reload_nginx()
    audit(user['username'], get_client_ip(request), 'website_settings',
          f'修改网站 {site["domain"]} 高级设置（伪静态/重定向/密码/防盗链/多域名/HTTPS）', 'warning')
    return {'ok': True}


def _render_single(site: dict) -> str:
    from ..waf_core import render_waf_block
    waf = render_waf_block()
    domain = site['domain']
    st = query('SELECT * FROM site_settings WHERE site_id=?', (site['id'],), one=True) or {}
    # 宝塔式：该域名已有有效证书 → 自动生成 443 HTTPS server 块 + 80 自动跳转
    ssl_cert = query("SELECT * FROM ssl_certs WHERE domain=? AND cert_path!='' ORDER BY id DESC",
                     (domain,), one=True)
    has_ssl = bool(ssl_cert and os.path.isfile(ssl_cert['cert_path']))
    # 宝塔式：多域名绑定
    names = [domain]
    for d in (st.get('domains') or '').replace('\n', ' ').split():
        d = d.strip().lower()
        if d and d not in names:
            names.append(d)
    server_name = ' '.join(names)
    extra = ''
    if st.get('force_https') or has_ssl:
        extra += ('\n    # 强制 HTTPS（已部署证书自动开启）\n'
                  '    if ($scheme = http) { return 301 https://$host$request_uri; }\n')
    if st.get('redirect'):
        extra += f'\n    # 301 重定向\n    return 301 {st["redirect"]};\n'
    if st.get('auth_user') and st.get('auth_hash'):
        extra += (f'\n    # 目录密码保护\n    auth_basic "Site Auth";\n'
                  f'    auth_basic_user_file /etc/nginx/rt-auth-{site["id"]};\n')
    hotlink = st.get('hotlink') or ''
    if hotlink:
        domains = ' '.join(d.strip() for d in hotlink.replace('\n', ' ').split(' ') if d.strip())
        extra += (f'\n    # 防盗链（允许来源）\n    valid_referers none blocked {domains};\n'
                  f'    if ($invalid_referer) {{ return 403; }}\n')
    pseudo = st.get('pseudo') or ''
    pseudo_rules = ''
    if pseudo.startswith('custom::'):
        pseudo_rules = pseudo.split('::', 1)[1]
    elif pseudo in PSEUDO_RULES:
        pseudo_rules = PSEUDO_RULES[pseudo]['rules']
    if pseudo_rules:
        extra += f'\n    # 伪静态规则\n    location / {{\n        {pseudo_rules}\n    }}\n'
    index_doc = (st.get('index_doc') or '').strip()
    index_line = f'    index {index_doc};' if index_doc else '    index index.html index.htm index.php;'
    if site['type'] == 'proxy':
        target = site['config']
        base = f'''server {{
    listen {site['port']};
    listen [::]:{site['port']};
    server_name {server_name};
{waf}{extra}
    location / {{
        proxy_pass {target};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }}
}}'''
    else:
        base = f'''server {{
    listen {site['port']};
    listen [::]:{site['port']};
    server_name {server_name};
{waf}{extra}
    root {site['root']};
{index_line}

    location / {{
        try_files $uri $uri/ =404;
    }}

    location ~ \\.php$ {{
        try_files $uri =404;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }}

    location ~ /\\.(?!well-known).* {{
        deny all;
    }}
}}'''
    # 宝塔式：域名已部署证书 → 自动追加 443 HTTPS server 块（SSL 整合进网站管理）
    if has_ssl:
        cert_path = ssl_cert['cert_path'].replace('\\', '/')
        key_path = ssl_cert['key_path'].replace('\\', '/')
        if site['type'] == 'proxy':
            target = site['config']
            https_block = f'''

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {server_name};
    ssl_certificate {cert_path};
    ssl_certificate_key {key_path};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
{waf}
    location / {{
        proxy_pass {target};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}'''
        else:
            https_block = f'''

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {server_name};
    ssl_certificate {cert_path};
    ssl_certificate_key {key_path};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
{waf}
    root {site['root']};
{index_line}
    location / {{
        try_files $uri $uri/ =404;
    }}
}}'''
        return base + https_block
    return base


def _render_nginx():
    sites = query('SELECT * FROM websites WHERE status=1')
    out = []
    # WAF CC 限流 zone 定义（http 上下文，需在所有 server 块之前）
    if query("SELECT id FROM waf_rules WHERE enabled=1 AND kind='cc'", one=True):
        out.append('limit_req_zone $binary_remote_addr zone=rtwaf:10m rate=10r/s;')
    for s in sites:
        out.append(_render_single(s))
    conf_dir = '/etc/nginx/conf.d'
    os.makedirs(conf_dir, exist_ok=True)
    try:
        with open(os.path.join(conf_dir, 'RT面板.conf'), 'w', encoding='utf-8') as f:
            f.write('\n'.join(out))
    except PermissionError:
        pass  # 无权限时仅面板内生效


def _reload_nginx():
    run_cmd('nginx -t 2>&1 && nginx -s reload 2>&1', timeout=30, shell=True)
