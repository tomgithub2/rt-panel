"""Docker 管理：容器/镜像/网络/卷，全部走 docker CLI。"""
from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..database import execute, now, query
from ..utils.exec_utils import run_cmd

router = APIRouter(prefix='/api/docker', tags=['docker'],
                   dependencies=[Depends(require_feature('docker'))])


def _check():
    r = run_cmd('docker info --format "{{.ServerVersion}}"', timeout=15)
    if r['code'] != 0:
        raise HTTPException(status_code=503,
                            detail='Docker 不可用：' + (r['stderr'][:200] or '未安装或服务未启动'))


@router.get('/status')
def docker_status(user: dict = Depends(require_perm('docker:view'))):
    _check()
    info = run_cmd('docker info --format "{{json .}}"', timeout=20)
    import json
    data = {}
    try:
        data = json.loads(info['stdout'])
    except Exception:
        pass
    return {
        'version': data.get('ServerVersion', ''),
        'containers': data.get('Containers', 0),
        'running': data.get('ContainersRunning', 0),
        'images': data.get('Images', 0),
        'os': data.get('OperatingSystem', ''),
        'cpus': data.get('NCPU', 0),
        'memory': data.get('MemTotal', 0),
    }


@router.get('/containers')
def containers(user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd('docker ps -a --format "{{json .}}"', timeout=30)
    import json
    out = []
    for line in r['stdout'].splitlines():
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return {'list': out}


@router.post('/containers/{cid}/action')
def container_action(cid: str, body: dict, request: Request,
                     user: dict = Depends(require_perm('docker:manage'))):
    _check()
    action = body.get('action')
    if action not in ('start', 'stop', 'restart', 'remove', 'kill', 'pause', 'unpause'):
        raise HTTPException(status_code=400, detail='未知操作')
    force = ' -f' if action == 'remove' and body.get('force') else ''
    r = run_cmd(f'docker {action} {force} {cid}', timeout=120, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '操作失败')
    audit(user['username'], get_client_ip(request), 'docker_action',
          f'{action} 容器 {cid}', 'warning' if action in ('stop', 'kill', 'remove') else 'info')
    return {'ok': True}


@router.post('/containers/create')
def container_create(body: dict, request: Request,
                     user: dict = Depends(require_perm('docker:manage'))):
    _check()
    image = str(body.get('image', '')).strip()
    name = str(body.get('name', '')).strip()
    if not image:
        raise HTTPException(status_code=400, detail='镜像不能为空')
    cmd = f'docker run -d --restart {body.get("restart", "unless-stopped")}'
    if name:
        cmd += f' --name {name}'
    for p in body.get('ports', []):
        if isinstance(p, str) and ':' in p:
            cmd += f' -p {p}'
        elif isinstance(p, dict) and p.get('host') and p.get('container'):
            cmd += f' -p {p["host"]}:{p["container"]}'
    for e in body.get('env', []):
        if isinstance(e, str) and '=' in e:
            cmd += f' -e {e}'
    for v in body.get('volumes', []):
        if isinstance(v, str) and ':' in v:
            cmd += f' -v {v}'
    if body.get('network'):
        cmd += f' --network {body["network"]}'
    cmd += f' {image}'
    if body.get('command'):
        cmd += f' {body["command"]}'
    r = run_cmd(cmd, timeout=600, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '创建失败')
    audit(user['username'], get_client_ip(request), 'docker_create',
          f'创建容器 {name or ""} 镜像 {image}')
    return {'ok': True, 'id': r['stdout'].strip()[:64]}


@router.get('/containers/{cid}/logs')
def container_logs(cid: str, lines: int = 200,
                   user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd(f'docker logs --tail {min(lines, 2000)} {cid} 2>&1', timeout=30, shell=True)
    return {'logs': r['stdout'] + r['stderr']}


@router.get('/containers/{cid}/stats')
def container_stats(cid: str, user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd(f'docker stats --no-stream --format "{{json .}}" {cid}', timeout=30)
    import json
    try:
        return json.loads(r['stdout'].strip())
    except Exception:
        return {'error': r['stderr'][:200]}


@router.get('/images')
def images(user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd('docker images --format "{{json .}}"', timeout=30)
    import json
    out = []
    for line in r['stdout'].splitlines():
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return {'list': out}


@router.post('/images/pull')
def image_pull(body: dict, request: Request, user: dict = Depends(require_perm('docker:manage'))):
    _check()
    image = str(body.get('image', '')).strip()
    if not image:
        raise HTTPException(status_code=400, detail='镜像名不能为空')
    import threading
    t = threading.Thread(target=run_cmd, args=(f'docker pull {image}',),
                         kwargs={'timeout': 3600, 'shell': True}, daemon=True)
    t.start()
    audit(user['username'], get_client_ip(request), 'docker_pull', f'拉取镜像 {image}')
    return {'ok': True, 'msg': '拉取任务已启动'}


@router.delete('/images/{image_id}')
def image_remove(image_id: str, request: Request,
                 user: dict = Depends(require_perm('docker:manage'))):
    _check()
    r = run_cmd(f'docker rmi {image_id}', timeout=300, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '')[:300] or '删除失败')
    audit(user['username'], get_client_ip(request), 'docker_rmi', f'删除镜像 {image_id}', 'warning')
    return {'ok': True}


@router.get('/networks')
def networks(user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd('docker network ls --format "{{json .}}"', timeout=30)
    import json
    return {'list': [json.loads(l) for l in r['stdout'].splitlines() if l.strip()]}


@router.get('/volumes')
def volumes(user: dict = Depends(require_perm('docker:view'))):
    _check()
    r = run_cmd('docker volume ls --format "{{json .}}"', timeout=30)
    import json
    return {'list': [json.loads(l) for l in r['stdout'].splitlines() if l.strip()]}
