# Created by 小杜 on 2026/08

"""SSL 证书：自签名、Let's Encrypt（certbot）、本地证书上传。"""
import datetime
import os
import re

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..config import CERT_DIR
from ..database import execute, now, query
from ..utils.exec_utils import run_cmd

router = APIRouter(prefix='/api/ssl', tags=['ssl'],
                   dependencies=[Depends(require_feature('ssl'))])


def _cert_meta(cert_path: str, key_path: str = '') -> dict:
    """解析证书有效期与域名。"""
    try:
        from cryptography import x509
        from cryptography.hazmat.backends import default_backend
        with open(cert_path, 'rb') as f:
            cert = x509.load_pem_x509_certificate(f.read(), default_backend())
        cn = cert.subject.get_attributes_for_oid(x509.NameOID.COMMON_NAME)
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName).value \
            if len(cert.extensions) else None
        domains = [c.value for c in san] if san else [cn[0].value if cn else '']
        return {
            'domains': domains,
            'expires': cert.not_valid_after_utc.timestamp(),
            'issuer': str(cert.issuer.rfc4514_string())[:200],
        }
    except Exception as e:
        return {'domains': [], 'expires': None, 'issuer': '', 'error': str(e)}


def _deploy_to_site(domain: str) -> bool:
    """证书变更后自动部署到对应网站（重渲染 Nginx 配置 + reload）。
    整合进网站管理：申请/上传/删除证书即时在网站生效。"""
    try:
        from . import websites
        if query('SELECT id FROM websites WHERE domain=?', (domain,), one=True):
            websites._render_nginx()
            websites._reload_nginx()
            return True
    except Exception:
        pass
    return False


@router.get('/certs')
def cert_list(user: dict = Depends(require_perm('ssl:view'))):
    rows = query('SELECT * FROM ssl_certs ORDER BY id DESC')
    for r in rows:
        r['expires'] = r['expires']
    return {'list': rows}



# ---------------- P-03 / P-22 / P-23：域名与证书目录校验 ----------------
DOMAIN_RE = re.compile(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$')
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _valid_domain(domain: object) -> str:
    """域名白名单（P-03：域名会进 openssl/certbot 命令，绝不能带 shell 元字符）。"""
    text = str(domain or '').strip().lower()
    if len(text) > 253 or not DOMAIN_RE.match(text):
        raise HTTPException(status_code=400, detail='域名格式不正确')
    return text


def _validate_email(email: object) -> str:
    text = str(email or '').strip()
    if not text:
        return ''
    if len(text) > 254 or not EMAIL_RE.match(text):
        raise HTTPException(status_code=400, detail='邮箱格式不正确')
    return text


def _cert_dir_safe(domain: str) -> str:
    """证书目录必须落在 CERT_DIR 内（P-22：domain 曾是 query 参数，可传绝对路径/../）。"""
    base = os.path.realpath(CERT_DIR)
    target = os.path.realpath(os.path.join(CERT_DIR, domain))
    try:
        if os.path.commonpath([base, target]) != base:
            raise HTTPException(status_code=400, detail='证书目录越界')
    except ValueError:
        raise HTTPException(status_code=400, detail='证书目录越界')
    return target


def _write_private(path: str, data: bytes):
    """私钥落盘 0600（P-23：原来用普通 open，umask 0022 下是 0644，普通用户可读）。"""
    flags = os.O_CREAT | os.O_TRUNC | os.O_WRONLY
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    fd = os.open(path, flags, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)
    try:
        os.chmod(path, 0o600)
    except Exception:
        pass


def _key_matches_cert(cert_path: str, key_path: str) -> bool:
    """校验 cert 与 key 是否配对（P-25t：上传时不配对会导致 nginx 起不来）。"""
    try:
        from cryptography.hazmat.primitives import serialization
        with open(cert_path, 'rb') as f:
            cert = serialization.load_pem_x509_certificate(f.read())
        with open(key_path, 'rb') as f:
            key = serialization.load_pem_private_key(f.read(), password=None)
        pub_cert = cert.public_key().public_bytes(
            serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        pub_key = key.public_key().public_bytes(
            serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
        return pub_cert == pub_key
    except Exception:
        return False

@router.post('/selfsigned')
def selfsigned(body: dict, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    domain = _valid_domain(body.get('domain', ''))
    days = int(body.get('days', 365))
    d = _cert_dir_safe(domain)
    os.makedirs(d, mode=0o700, exist_ok=True)
    key = os.path.join(d, 'privkey.pem')
    cert = os.path.join(d, 'fullchain.pem')
    # argv + shell=False：域名已过白名单，但仍不拼 shell（§0.2 统一模式）
    r = run_cmd(['openssl', 'req', '-x509', '-newkey', 'rsa:2048',
                 '-keyout', key, '-out', cert,
                 '-days', str(days), '-nodes',
                 '-subj', f'/CN={domain}',
                 '-addext', f'subjectAltName=DNS:{domain}'],
                timeout=120, shell=False)
    if r['code'] != 0 or not os.path.isfile(cert):
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '生成失败')
    meta = _cert_meta(cert)
    if query('SELECT id FROM ssl_certs WHERE domain=?', (domain,), one=True):
        execute('UPDATE ssl_certs SET type=?, cert_path=?, key_path=?, expires=?, created_at=? '
                'WHERE domain=?',
                ('selfsigned', cert, key, meta.get('expires'), now(), domain))
    else:
        execute('INSERT INTO ssl_certs (domain,type,cert_path,key_path,expires,created_at) '
                'VALUES (?,?,?,?,?,?)',
                (domain, 'selfsigned', cert, key, meta.get('expires'), now()))
    try:
        os.chmod(key, 0o600)
    except Exception:
        pass
    audit(user['username'], get_client_ip(request), 'ssl_selfsigned', f'生成自签名证书 {domain}')
    deployed = _deploy_to_site(domain)
    return {'ok': True, 'cert': cert, 'key': key, 'meta': meta, 'deployed': deployed}


@router.post('/issue')
def issue(body: dict, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    """通过 certbot 申请 Let's Encrypt 证书（需域名解析到本机 + 80 端口可达）。"""
    domain = _valid_domain(body.get('domain', ''))
    email = _validate_email(body.get('email', ''))
    r = run_cmd(['certbot', '--version'], timeout=10)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail='未安装 certbot，请先在软件商店安装')
    webroot = str(body.get('webroot', '')) or '/var/www/html'
    # webroot 必须是已存在的绝对目录，且不能落在面板数据目录里（§0.3）
    from ..utils.pathguard import SENSITIVE_DIRS, _inside
    webroot = os.path.realpath(webroot)
    if not os.path.isabs(webroot) or not os.path.isdir(webroot):
        raise HTTPException(status_code=400, detail='站点根目录不存在或不是绝对路径')
    if any(_inside(webroot, d) for d in SENSITIVE_DIRS):
        raise HTTPException(status_code=400, detail='站点根目录不能指向面板数据目录')
    cmd = ['certbot', 'certonly', '--webroot', '-w', webroot, '-d', domain,
           '--non-interactive', '--agree-tos', '--keep-until-expiring']
    if email:
        cmd += ['-m', email]
    r = run_cmd(cmd, timeout=600, shell=False)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or r['stdout'])[-500:] or '申请失败')
    cert = f'/etc/letsencrypt/live/{domain}/fullchain.pem'
    key = f'/etc/letsencrypt/live/{domain}/privkey.pem'
    meta = _cert_meta(cert) if os.path.isfile(cert) else {}
    if query('SELECT id FROM ssl_certs WHERE domain=?', (domain,), one=True):
        execute('UPDATE ssl_certs SET type=?, cert_path=?, key_path=?, expires=?, auto_renew=1 '
                'WHERE domain=?', ('letsencrypt', cert, key, meta.get('expires'), domain))
    else:
        execute('INSERT INTO ssl_certs (domain,type,cert_path,key_path,expires,auto_renew,created_at) '
                'VALUES (?,?,?,?,?,1,?)',
                (domain, 'letsencrypt', cert, key, meta.get('expires'), now()))
    audit(user['username'], get_client_ip(request), 'ssl_issue', f'签发 Let\'s Encrypt 证书 {domain}')
    deployed = _deploy_to_site(domain)
    return {'ok': True, 'cert': cert, 'key': key, 'meta': meta, 'deployed': deployed}


@router.post('/upload')
async def upload(domain: str, cert: UploadFile, key: UploadFile,
                 request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    # P-22：domain 是 query 参数，原来直接 os.path.join —— 传绝对路径会丢掉 CERT_DIR，
    # 传 ../../ 也能越界（以 root 在任意目录写入内容可控的证书/私钥）。
    domain = _valid_domain(domain)
    d = _cert_dir_safe(domain)
    os.makedirs(d, mode=0o700, exist_ok=True)
    cert_path = os.path.join(d, 'fullchain.pem')
    key_path = os.path.join(d, 'privkey.pem')
    cert_bytes = await cert.read()
    key_bytes = await key.read()
    if len(cert_bytes) > 1_000_000 or len(key_bytes) > 200_000:
        raise HTTPException(status_code=400, detail='证书/私钥文件过大')
    # 先写证书，再以 0600 写私钥（P-23）
    with open(cert_path, 'wb') as f:
        f.write(cert_bytes)
    _write_private(key_path, key_bytes)
    # P-25t：配对校验，避免上传不匹配的证书/私钥把 nginx 弄挂
    if not _key_matches_cert(cert_path, key_path):
        try:
            os.remove(cert_path)
            os.remove(key_path)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail='证书与私钥不匹配，已拒绝')
    meta = _cert_meta(cert_path)
    if query('SELECT id FROM ssl_certs WHERE domain=?', (domain,), one=True):
        execute('UPDATE ssl_certs SET type=?, cert_path=?, key_path=?, expires=? WHERE domain=?',
                ('uploaded', cert_path, key_path, meta.get('expires'), domain))
    else:
        execute('INSERT INTO ssl_certs (domain,type,cert_path,key_path,expires,created_at) '
                'VALUES (?,?,?,?,?,?)',
                (domain, 'uploaded', cert_path, key_path, meta.get('expires'), now()))
    audit(user['username'], get_client_ip(request), 'ssl_upload', f'上传证书 {domain}')
    deployed = _deploy_to_site(domain)
    return {'ok': True, 'meta': meta, 'deployed': deployed}


@router.delete('/{sid}')
def cert_delete(sid: int, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    cert = query('SELECT * FROM ssl_certs WHERE id=?', (sid,), one=True)
    if not cert:
        raise HTTPException(status_code=404, detail='证书不存在')
    execute('DELETE FROM ssl_certs WHERE id=?', (sid,))
    audit(user['username'], get_client_ip(request), 'ssl_delete',
          f'删除证书 {cert["domain"]}', 'warning')
    _deploy_to_site(cert['domain'])
    return {'ok': True}


@router.post('/{sid}/renew')
def cert_renew(sid: int, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    result = renew_cert(sid)
    if result.get('ok'):
        audit(user['username'], get_client_ip(request), 'ssl_renew',
              f'续期证书 #{sid}', 'info')
        cert = query('SELECT * FROM ssl_certs WHERE id=?', (sid,), one=True)
        if cert:
            _deploy_to_site(cert['domain'])
    return result


def renew_cert(sid: int) -> dict:
    """自动续期（certbot renew 或重新签发）。"""
    cert = query('SELECT * FROM ssl_certs WHERE id=?', (sid,), one=True)
    if not cert:
        return {'ok': False, 'error': '证书不存在'}
    if cert['type'] == 'letsencrypt':
        domain = str(cert.get('domain') or '').strip()
        if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$',
                        domain):
            return {'ok': False, 'error': '证书域名无效'}
        r = run_cmd(['certbot', 'renew', '--cert-name', domain, '--quiet'],
                    timeout=600, shell=False)
        if r['code'] == 0 and cert['cert_path'] and os.path.isfile(cert['cert_path']):
            meta = _cert_meta(cert['cert_path'])
            execute('UPDATE ssl_certs SET expires=? WHERE id=?', (meta.get('expires'), sid))
            return {'ok': True, 'meta': meta}
        return {'ok': False, 'error': (r['stderr'] or r['stdout'])[-300:]}
    return {'ok': False, 'error': '非 Let\'s Encrypt 证书无需续期'}
