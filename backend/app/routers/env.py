# Created by 小杜 on 2026/08

"""运行环境探测 + 一键安装（供 Docker / 数据库等页面做"没装先引导安装"的门禁）。

设计：安装动作复用软件商店的目录与命令映射（software.CATALOG），
这里只负责"探测是否已装/是否在跑/当前平台能否自动装/装不了给什么指引"。
"""
import threading

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, get_current_user, require_perm
from ..database import execute, now
from ..utils.exec_utils import IS_WIN, run_cmd
from .software import CATALOG, _platform_key

router = APIRouter(prefix='/api/env', tags=['env'])

# 服务是否在运行的探测命令（装了但没启动是最常见的情况，要能区分出来）
RUNNING_CMD = {
    'docker': 'docker info --format "{{.ServerVersion}}"',
    'mysql': 'mysqladmin ping --silent',
    'postgresql': 'pg_isready',
    'redis': 'redis-cli ping',
    'mongodb': 'mongosh --quiet --eval "db.runCommand({ping:1}).ok"',
}

# 服务名（用于 /api/services/action 启停）
SERVICE_NAME = {
    'docker': 'docker',
    'mysql': 'mysql',
    'postgresql': 'postgresql',
    'redis': 'redis',
}

# 平台不支持自动安装时给出的指引
MANUAL_HINT = {
    'docker': 'Windows：安装 Docker Desktop（docker.com/products/docker-desktop）并启用 WSL2 后端；'
              'Linux：curl -fsSL https://get.docker.com | sh',
    'mysql': 'Windows：使用 MySQL Installer（dev.mysql.com/downloads/installer）；'
             'Linux：apt-get install -y mysql-server',
    'postgresql': 'Windows：使用 PostgreSQL 官方安装包（postgresql.org/download/windows）；'
                  'Linux：apt-get install -y postgresql',
    'redis': 'Windows：推荐用 Docker 运行 redis，或使用 Memurai；'
             'Linux：apt-get install -y redis-server',
}

DEFAULT_KEYS = ['docker', 'mysql', 'postgresql', 'redis']


def _probe(key: str) -> dict:
    item = CATALOG.get(key)
    if not item:
        return {}
    r = run_cmd(item['detect'], timeout=20, shell=True)
    installed = r['code'] == 0
    version = ''
    if installed:
        v = run_cmd(item['version'], timeout=20, shell=True)
        text = (v['stdout'] or v['stderr']).strip()
        version = text.splitlines()[0][:80] if text else ''
    running = False
    if installed and key in RUNNING_CMD:
        running = run_cmd(RUNNING_CMD[key], timeout=20, shell=True)['code'] == 0
    pk = _platform_key()
    return {
        'key': key,
        'name': item['name'],
        'cat': item.get('cat', ''),
        'installed': installed,
        'running': running,
        'version': version,
        'installable': pk in item['install'],
        'command': item['install'].get(pk, ''),
        'manual': MANUAL_HINT.get(key, ''),
        'service': SERVICE_NAME.get(key, ''),
        'note': item.get('note', ''),
    }


@router.get('')
def env_status(keys: str = '', user: dict = Depends(get_current_user)):
    """探测指定软件的环境状态（默认 docker/数据库四件套）。"""
    want = [k.strip() for k in keys.split(',') if k.strip()] or DEFAULT_KEYS
    want = [k for k in want if k in CATALOG]
    if not want:
        raise HTTPException(status_code=400, detail='未知的软件标识')
    return {'list': [_probe(k) for k in want], 'platform': _platform_key(),
            'is_win': IS_WIN}


@router.post('/install')
def env_install(body: dict, request: Request,
                user: dict = Depends(require_perm('software:manage'))):
    """一键安装（后台执行，进度用 /api/software/install-status 查询）。"""
    key = str(body.get('key', ''))
    item = CATALOG.get(key)
    if not item:
        raise HTTPException(status_code=404, detail='未知软件')
    pk = _platform_key()
    cmd = item['install'].get(pk)
    if not cmd:
        raise HTTPException(status_code=400,
                            detail=MANUAL_HINT.get(key) or '当前平台暂不支持自动安装，请手动安装')
    audit(user['username'], get_client_ip(request), 'env_install',
          f'环境安装 {item["name"]}', 'warning')

    def _do():
        r = run_cmd(cmd, timeout=1800, shell=True)
        output = (r['stdout'] + r['stderr'])[-2000:]
        execute('INSERT INTO software_installs (name,action,ts,exit_code,output) VALUES (?,?,?,?,?)',
                (key, 'install', now(), r['code'], output))

    threading.Thread(target=_do, daemon=True).start()
    return {'ok': True, 'msg': f'{item["name"]} 安装任务已在后台启动', 'async': True, 'key': key}
