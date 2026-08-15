# Created by 小杜 on 2026/08

"""SSL 证书：自签名、Let's Encrypt（certbot）、本地证书上传。"""
import datetime
import os

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


@router.post('/selfsigned')
def selfsigned(body: dict, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    domain = str(body.get('domain', '')).strip()
    days = int(body.get('days', 365))
    if not domain:
        raise HTTPException(status_code=400, detail='域名不能为空')
    d = os.path.join(CERT_DIR, domain)
    os.makedirs(d, exist_ok=True)
    key = os.path.join(d, 'privkey.pem')
    cert = os.path.join(d, 'fullchain.pem')
    r = run_cmd(
        f'openssl req -x509 -newkey rsa:2048 -keyout "{key}" -out "{cert}" '
        f'-days {days} -nodes -subj "/CN={domain}" -addext "subjectAltName=DNS:{domain}"',
        timeout=120, shell=True)
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
    audit(user['username'], get_client_ip(request), 'ssl_selfsigned', f'生成自签名证书 {domain}')
    deployed = _deploy_to_site(domain)
    return {'ok': True, 'cert': cert, 'key': key, 'meta': meta, 'deployed': deployed}


@router.post('/issue')
def issue(body: dict, request: Request, user: dict = Depends(require_perm('ssl:manage'))):
    """通过 certbot 申请 Let's Encrypt 证书（需域名解析到本机 + 80 端口可达）。"""
    domain = str(body.get('domain', '')).strip()
    email = str(body.get('email', '')).strip()
    if not domain:
        raise HTTPException(status_code=400, detail='域名不能为空')
    r = run_cmd('certbot --version', timeout=10)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail='未安装 certbot，请先在软件商店安装')
    webroot = str(body.get('webroot', '')) or '/var/www/html'
    cmd = (f'certbot certonly --webroot -w "{webroot}" -d {domain} '
           f'--non-interactive --agree-tos --keep-until-expiring')
    if email:
        cmd += f' -m {email}'
    r = run_cmd(cmd, timeout=600, shell=True)
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
    d = os.path.join(CERT_DIR, domain)
    os.makedirs(d, exist_ok=True)
    cert_path = os.path.join(d, 'fullchain.pem')
    key_path = os.path.join(d, 'privkey.pem')
    with open(cert_path, 'wb') as f:
        f.write(await cert.read())
    with open(key_path, 'wb') as f:
        f.write(await key.read())
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
        r = run_cmd(f'certbot renew --cert-name {cert["domain"]} --quiet', timeout=600, shell=True)
        if r['code'] == 0 and cert['cert_path'] and os.path.isfile(cert['cert_path']):
            meta = _cert_meta(cert['cert_path'])
            execute('UPDATE ssl_certs SET expires=? WHERE id=?', (meta.get('expires'), sid))
            return {'ok': True, 'meta': meta}
        return {'ok': False, 'error': (r['stderr'] or r['stdout'])[-300:]}
    return {'ok': False, 'error': '非 Let\'s Encrypt 证书无需续期'}
