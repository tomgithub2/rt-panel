"""文件管理器：浏览/读写/上传下载/压缩解压/搜索/权限。"""
import base64
import io
import mimetypes
import os
import shutil
import stat
import tarfile
import tempfile
import time
import zipfile

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from ..audit import audit
from ..auth import get_client_ip, get_current_user, get_current_user_query, require_perm
from ..rbac import role_permissions

router = APIRouter(prefix='/api/files', tags=['files'])

SORT_KEYS = {'name': 'name', 'size': 'size', 'mtime': 'mtime'}


def _norm(path: str) -> str:
    if not path:
        raise HTTPException(status_code=400, detail='路径为空')
    return os.path.normpath(path)


def _has(user: dict, perm: str) -> bool:
    return user['role'] == 'admin' or perm in role_permissions(user['role'])


def _entry(path: str) -> dict:
    st = os.stat(path)
    is_dir = os.path.isdir(path)
    return {
        'name': os.path.basename(path) or path,
        'path': path,
        'is_dir': is_dir,
        'size': st.st_size if not is_dir else 0,
        'mtime': st.st_mtime,
        'mode': oct(stat.S_IMODE(st.st_mode))[2:],
        'ext': '' if is_dir else os.path.splitext(path)[1].lower(),
        'hidden': os.path.basename(path).startswith('.'),
    }


def _default_path() -> str:
    """默认起始目录：Windows 返回系统盘根目录，Linux 返回根目录。"""
    if os.name == 'nt':
        drive = os.environ.get('SystemDrive', 'C:')
        return drive + '\\'
    return '/'


@router.get('/list')
def list_dir(path: str = '', sort: str = 'name', desc: bool = False,
             user: dict = Depends(require_perm('files:read'))):
    if not path:
        path = _default_path()
    path = _norm(path)
    if not os.path.isdir(path):
        raise HTTPException(status_code=404, detail='目录不存在')
    items = []
    try:
        for name in os.listdir(path):
            full = os.path.join(path, name)
            try:
                items.append(_entry(full))
            except OSError:
                continue
    except PermissionError:
        raise HTTPException(status_code=403, detail='无权限访问该目录')
    key = SORT_KEYS.get(sort, 'name')
    items.sort(key=lambda x: (not x['is_dir'], x[key] if key != 'name' else x['name'].lower()),
               reverse=desc)
    parent = os.path.dirname(path) if os.path.dirname(path) != path else ''
    return {'path': path, 'parent': parent, 'items': items, 'drives': _drives()}


def _drives():
    if os.name == 'nt':
        import string
        import ctypes
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        return [f'{d}:\\' for d in string.ascii_uppercase if bitmask & (1 << (ord(d) - 65))]
    return ['/']


@router.get('/read')
def read_file(path: str, user: dict = Depends(require_perm('files:read'))):
    path = _norm(path)
    if os.path.isdir(path):
        raise HTTPException(status_code=400, detail='目标是目录')
    size = os.path.getsize(path)
    if size > 2 * 1024 * 1024:
        return {'path': path, 'too_large': True, 'size': size}
    try:
        with open(path, 'rb') as f:
            data = f.read()
    except PermissionError:
        raise HTTPException(status_code=403, detail='无权限读取')
    try:
        text = data.decode('utf-8')
        encoding = 'utf-8'
    except UnicodeDecodeError:
        try:
            text = data.decode('gbk')
            encoding = 'gbk'
        except UnicodeDecodeError:
            return {'path': path, 'binary': True, 'size': size,
                    'base64': base64.b64encode(data).decode()}
    return {'path': path, 'content': text, 'encoding': encoding, 'size': size,
            'mtime': os.path.getmtime(path)}


@router.post('/write')
def write_file(body: dict, request: Request,
               user: dict = Depends(require_perm('files:write'))):
    path = _norm(body.get('path', ''))
    content = body.get('content', '')
    encoding = body.get('encoding', 'utf-8')
    os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
    try:
        with open(path, 'w', encoding=encoding or 'utf-8', newline='') as f:
            f.write(content)
    except PermissionError:
        raise HTTPException(status_code=403, detail='无权限写入')
    audit(user['username'], get_client_ip(request), 'file_write', path)
    return {'ok': True}


@router.post('/mkdir')
def mkdir(body: dict, user: dict = Depends(require_perm('files:write'))):
    path = _norm(body.get('path', ''))
    os.makedirs(path, exist_ok=True)
    return {'ok': True}


@router.post('/rename')
def rename(body: dict, user: dict = Depends(require_perm('files:write'))):
    src = _norm(body.get('path', ''))
    name = os.path.basename(body.get('new_name', ''))
    if not name:
        raise HTTPException(status_code=400, detail='名称无效')
    dst = os.path.join(os.path.dirname(src), name)
    if src == dst:
        return {'ok': True}
    if os.path.exists(dst):
        raise HTTPException(status_code=409, detail='目标已存在')
    os.rename(src, dst)
    return {'ok': True}


@router.post('/delete')
def delete(body: dict, user: dict = Depends(require_perm('files:write'))):
    paths = body.get('paths', [])
    if isinstance(paths, str):
        paths = [paths]
    deleted = []
    for p in paths:
        p = _norm(p)
        if os.path.isdir(p) and not os.path.islink(p):
            shutil.rmtree(p, ignore_errors=False)
        else:
            os.remove(p)
        deleted.append(p)
    return {'ok': True, 'deleted': deleted}


@router.post('/copy')
def copy(body: dict, user: dict = Depends(require_perm('files:write'))):
    src = _norm(body.get('src', ''))
    dest = _norm(body.get('dest', ''))
    if os.path.isdir(src):
        shutil.copytree(src, dest)
    else:
        shutil.copy2(src, dest)
    return {'ok': True}


@router.post('/move')
def move(body: dict, user: dict = Depends(require_perm('files:write'))):
    src = _norm(body.get('src', ''))
    dest = _norm(body.get('dest', ''))
    shutil.move(src, dest)
    return {'ok': True}


@router.post('/compress')
def compress(body: dict, user: dict = Depends(require_perm('files:write'))):
    paths = body.get('paths', [])
    dest = _norm(body.get('dest', ''))
    fmt = body.get('format', 'zip')
    if not paths or not dest:
        raise HTTPException(status_code=400, detail='参数不完整')
    if fmt == 'zip':
        with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as zf:
            for p in paths:
                p = _norm(p)
                if os.path.isdir(p):
                    for root, dirs, files in os.walk(p):
                        for f in files:
                            fp = os.path.join(root, f)
                            zf.write(fp, os.path.relpath(fp, os.path.dirname(p)))
                else:
                    zf.write(p, os.path.basename(p))
    else:  # tar.gz
        with tarfile.open(dest, 'w:gz') as tf:
            for p in paths:
                p = _norm(p)
                tf.add(p, arcname=os.path.basename(p))
    return {'ok': True, 'size': os.path.getsize(dest)}


@router.post('/extract')
def extract(body: dict, user: dict = Depends(require_perm('files:write'))):
    path = _norm(body.get('path', ''))
    dest = _norm(body.get('dest', '')) or os.path.dirname(path)
    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail='文件不存在')
    os.makedirs(dest, exist_ok=True)
    lower = path.lower()
    if lower.endswith('.zip'):
        with zipfile.ZipFile(path) as zf:
            zf.extractall(dest)
    elif lower.endswith(('.tar.gz', '.tgz', '.tar')):
        mode = 'r:gz' if lower.endswith(('.tar.gz', '.tgz')) else 'r'
        with tarfile.open(path, mode) as tf:
            tf.extractall(dest)
    else:
        raise HTTPException(status_code=400, detail='不支持的压缩格式')
    return {'ok': True}


@router.post('/upload')
async def upload(path: str, files: list[UploadFile],
                 user: dict = Depends(require_perm('files:write'))):
    dest = _norm(path)
    os.makedirs(dest, exist_ok=True)
    saved = []
    for f in files:
        name = os.path.basename(f.filename or '')
        fp = os.path.join(dest, name)
        with open(fp, 'wb') as out:
            while True:
                chunk = await f.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        saved.append(name)
    return {'ok': True, 'saved': saved}


@router.get('/download')
def download(path: str, user: dict = Depends(require_perm('files:download'))):
    path = _norm(path)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail='文件不存在')
    name = os.path.basename(path)
    # 文件名 RFC5987 编码，兼容中文
    from urllib.parse import quote
    quoted = quote(name)
    return FileResponse(
        path, filename=name,
        headers={'Content-Disposition': f"attachment; filename*=UTF-8''{quoted}"})


@router.post('/chmod')
def chmod(body: dict, user: dict = Depends(require_perm('files:write'))):
    path = _norm(body.get('path', ''))
    try:
        mode = int(str(body.get('mode', '755')), 8)
    except ValueError:
        raise HTTPException(status_code=400, detail='权限值无效')
    os.chmod(path, mode)
    return {'ok': True}


@router.post('/chown')
def chown(body: dict, user: dict = Depends(require_perm('files:write'))):
    """Linux 下修改属主（root 有效），Windows 返回不支持。"""
    if os.name == 'nt':
        raise HTTPException(status_code=400, detail='Windows 不支持 chown')
    path = _norm(body.get('path', ''))
    owner = body.get('owner', '')
    try:
        import pwd
        import grp
        uid = pwd.getpwnam(owner).pw_uid if owner else -1
        gid = grp.getgrnam(owner).gr_gid if owner else -1
        os.chown(path, uid, gid)
        return {'ok': True}
    except KeyError:
        raise HTTPException(status_code=400, detail='用户不存在')
    except PermissionError:
        raise HTTPException(status_code=403, detail='需要 root 权限')


@router.get('/search')
def search(path: str, q: str, limit: int = 200,
           user: dict = Depends(require_perm('files:read'))):
    path = _norm(path)
    results = []
    try:
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith('.')][:50]
            for name in files + dirs:
                if q.lower() in name.lower():
                    fp = os.path.join(root, name)
                    try:
                        results.append(_entry(fp))
                    except OSError:
                        continue
                    if len(results) >= limit:
                        return {'list': results, 'truncated': True}
    except PermissionError:
        pass
    return {'list': results, 'truncated': False}


@router.get('/disk')
def disk(user: dict = Depends(require_perm('files:read'))):
    from ..utils.sysinfo import disk_info
    return disk_info()


@router.get('/text-extensions')
def text_extensions(user: dict = Depends(get_current_user)):
    return {'exts': ['.txt', '.log', '.md', '.conf', '.cfg', '.ini', '.json', '.xml',
                     '.yml', '.yaml', '.html', '.htm', '.css', '.js', '.ts', '.py',
                     '.sh', '.bat', '.cmd', '.ps1', '.sql', '.env', '.properties',
                     '.php', '.java', '.go', '.rs', '.c', '.h', '.cpp', '.csv', '.toml']}
