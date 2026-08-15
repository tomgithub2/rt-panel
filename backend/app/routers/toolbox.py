"""运维工具箱：常用命令一键执行 + 大文件扫描。"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request

from ..audit import audit
from ..auth import get_client_ip, require_feature, require_perm
from ..utils.exec_utils import IS_WIN, run_cmd

router = APIRouter(prefix='/api/toolbox', tags=['toolbox'],
                   dependencies=[Depends(require_feature('toolbox'))])

PRESETS_WIN = [
    {'name': '内存占用 TOP10 进程', 'cmd': 'powershell -NoProfile -Command "Get-Process | Sort-Object WS -Descending | Select-Object -First 10 Name,@{n=\"内存MB\";e={[math]::Round($_.WS/1MB)}} | Format-Table"', 'safe': True},
    {'name': '网络连接统计', 'cmd': 'netstat -ano | findstr ESTABLISHED', 'safe': True},
    {'name': '系统信息', 'cmd': 'systeminfo | findstr /C:"OS" /C:"System Boot" /C:"Total Physical"', 'safe': True},
    {'name': '磁盘空间', 'cmd': 'wmic logicaldisk get DeviceID,Size,FreeSpace', 'safe': True},
    {'name': '检查 Windows 更新', 'cmd': 'powershell -NoProfile -Command "Get-HotFix | Select-Object -Last 10 HotFixID,InstalledOn"', 'safe': True},
    {'name': '路由表', 'cmd': 'route print -4', 'safe': True},
]
PRESETS_LINUX = [
    {'name': '内存占用 TOP10 进程', 'cmd': "ps aux --sort=-%mem | head -n 11", 'safe': True},
    {'name': '磁盘占用分析', 'cmd': 'df -h && echo --- && du -sh /* 2>/dev/null | sort -rh | head -n 12', 'safe': True},
    {'name': '网络连接统计', 'cmd': "ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn", 'safe': True},
    {'name': 'TCP 连接数 TOP', 'cmd': "ss -tan | grep ESTAB | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -n 10", 'safe': True},
    {'name': '释放内存缓存', 'cmd': 'sync && echo 3 > /proc/sys/vm/drop_caches && echo "缓存已释放"', 'safe': True},
    {'name': '重载 Nginx', 'cmd': 'nginx -t && nginx -s reload && echo "Nginx 已重载"', 'safe': True},
    {'name': '最近登录记录', 'cmd': 'last -n 10', 'safe': True},
    {'name': '查看内核错误', 'cmd': 'dmesg --level=err,warn | tail -n 20', 'safe': True},
    {'name': '检查系统更新', 'cmd': 'apt list --upgradable 2>/dev/null | head -n 15 || yum check-update 2>/dev/null | head -n 15', 'safe': True},
    {'name': '当前目录大文件', 'cmd': 'du -ah . 2>/dev/null | sort -rh | head -n 20', 'safe': True},
]


@router.get('/presets')
def presets(user: dict = Depends(require_perm('system:view'))):
    return {'list': PRESETS_WIN if IS_WIN else PRESETS_LINUX}


@router.post('/run')
def run(body: dict, request: Request, user: dict = Depends(require_perm('system:manage'))):
    cmd = str(body.get('cmd', '')).strip()
    if not cmd:
        raise HTTPException(status_code=400, detail='命令不能为空')
    if len(cmd) > 2000:
        raise HTTPException(status_code=400, detail='命令过长')
    audit(user['username'], get_client_ip(request), 'toolbox_run', cmd[:200])
    r = run_cmd(cmd, timeout=int(body.get('timeout', 60)), shell=True)
    return {'code': r['code'], 'output': (r['stdout'] + r['stderr'])[-8000:]}


# ---------------------------------------------------------------- Swap 管理（宝塔式）
@router.get('/swap')
def swap_status(user: dict = Depends(require_perm('system:view'))):
    """Linux Swap 状态 / Windows 页面文件。"""
    if IS_WIN:
        r = run_cmd('powershell -NoProfile -Command "Get-CimInstance Win32_PageFileUsage | '
                    'Select-Object Name,AllocatedBaseSize | ConvertTo-Json -Compress"', timeout=30)
        return {'supported': False, 'win': True, 'raw': r['stdout'][:500],
                'message': 'Windows 使用页面文件（系统自动管理）'}
    sw = run_cmd('swapon --show', timeout=10)
    mem = run_cmd('free -m', timeout=10)
    return {'supported': True, 'swapon': sw['stdout'].strip(),
            'free': mem['stdout'].strip(), 'files': _swap_files()}


def _swap_files() -> list:
    r = run_cmd('swapon --show=NAME --noheadings', timeout=10)
    out = []
    for line in r['stdout'].splitlines():
        name = line.strip()
        if name:
            out.append({'name': name, 'active': True})
    return out


@router.post('/swap')
def swap_create(body: dict, request: Request, user: dict = Depends(require_perm('system:manage'))):
    """创建 Swap 文件（宝塔式：大小 MB + swappiness）。"""
    if IS_WIN:
        raise HTTPException(status_code=400, detail='Windows 无需手动创建 Swap')
    size_mb = int(body.get('size_mb', 1024))
    if not 128 <= size_mb <= 65536:
        raise HTTPException(status_code=400, detail='Swap 大小需在 128MB-64GB 之间')
    path = '/swapfile'
    r = run_cmd(f'fallocate -l {size_mb}M {path} 2>/dev/null || dd if=/dev/zero of={path} '
                f'bs=1M count={size_mb} && chmod 600 {path} && mkswap {path} && '
                f'swapon {path}', timeout=600, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '创建失败')[:300])
    swappiness = int(body.get('swappiness', 10))
    run_cmd(f'sysctl vm.swappiness={swappiness}', timeout=10, shell=True)
    audit(user['username'], get_client_ip(request), 'swap_create',
          f'创建 Swap {size_mb}MB (swappiness={swappiness})', 'warning')
    return {'ok': True, 'message': f'Swap 已创建 {size_mb}MB 并启用'}


@router.delete('/swap')
def swap_delete(request: Request, user: dict = Depends(require_perm('system:manage'))):
    """关闭并删除 /swapfile。"""
    if IS_WIN:
        raise HTTPException(status_code=400, detail='Windows 无需手动管理 Swap')
    r = run_cmd('swapoff /swapfile 2>/dev/null; rm -f /swapfile', timeout=120, shell=True)
    if r['code'] != 0:
        raise HTTPException(status_code=500, detail=(r['stderr'] or '删除失败')[:300])
    audit(user['username'], get_client_ip(request), 'swap_delete', '删除 Swap 文件', 'warning')
    return {'ok': True}


@router.post('/scan-big')
def scan_big(body: dict, user: dict = Depends(require_perm('system:view'))):
    path = str(body.get('path', '')).strip()
    top = min(int(body.get('top', 30)), 100)
    if not path or not os.path.isdir(path):
        raise HTTPException(status_code=400, detail='目录不存在')
    results = []
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if not d.startswith('.')][:30]
        for f in files:
            fp = os.path.join(root, f)
            try:
                size = os.path.getsize(fp)
            except OSError:
                continue
            if size > 5 * 1024 * 1024:
                results.append({'path': fp, 'size': size})
        if len(results) > 5000:
            break
    results.sort(key=lambda x: -x['size'])
    return {'list': results[:top], 'total_found': len(results)}
