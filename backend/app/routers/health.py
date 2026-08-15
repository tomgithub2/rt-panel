"""一键体检中心：30+ 项系统健康检查，输出评分报告。"""
import os
import time

import psutil
from fastapi import APIRouter, Depends

from ..auth import require_perm
from ..config import get_config
from ..database import query

router = APIRouter(prefix='/api/healthcheck', tags=['healthcheck'])


def _check(weight: int, item: str, ok: bool, detail: str, suggestion: str = '') -> dict:
    return {'item': item, 'ok': ok, 'detail': detail, 'suggestion': suggestion,
            'weight': weight}


@router.get('/run')
def run(user: dict = Depends(require_perm('security:view'))):
    checks = []
    cfg = get_config()
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    cpu = psutil.cpu_percent(interval=0.1)
    load = os.getloadavg() if hasattr(os, 'getloadavg') else (0, 0, 0)
    cores = psutil.cpu_count(logical=True) or 1

    # ---- 资源 ----
    checks.append(_check(10, '内存使用率', vm.percent < 85,
                         f'{vm.percent}%（{vm.used / 2**30:.1f}/{vm.total / 2**30:.1f} GB）',
                         '内存持续高位请排查占用进程或考虑扩容'))
    checks.append(_check(8, '交换分区使用', sw.percent < 50,
                         f'{sw.percent}%', '交换使用过高说明物理内存不足'))
    checks.append(_check(8, 'CPU 负载', load[0] < cores * 1.5,
                         f'1分钟负载 {load[0]:.2f} / {cores} 核',
                         '负载持续高于核数 1.5 倍请检查业务进程'))
    for part in psutil.disk_partitions():
        try:
            u = psutil.disk_usage(part.mountpoint)
        except Exception:
            continue
        checks.append(_check(10, f'磁盘空间 {part.mountpoint}', u.percent < 90,
                             f'{u.percent}%（剩 {u.free / 2**30:.1f} GB）',
                             '磁盘即将写满，请清理或扩容'))

    # ---- 任务/备份 ----
    cron_fail = query("SELECT COUNT(*) c FROM cron_jobs WHERE enabled=1 AND last_status='failed'",
                      one=True)['c']
    checks.append(_check(8, '计划任务健康', cron_fail == 0,
                         f'{cron_fail} 个任务上次执行失败' if cron_fail else '全部正常',
                         '到计划任务页查看失败输出'))
    bak_fail = query("SELECT COUNT(*) c FROM backup_tasks WHERE enabled=1 AND last_status LIKE 'failed%'",
                     one=True)['c']
    checks.append(_check(8, '备份任务健康', bak_fail == 0,
                         f'{bak_fail} 个备份任务失败' if bak_fail else '全部正常',
                         '到备份中心排查失败原因'))

    # ---- SSL ----
    from ..database import now as _now
    expiring = query('SELECT COUNT(*) c FROM ssl_certs WHERE expires > 0 AND expires < ?',
                     (_now() + 30 * 86400,), one=True)['c']
    checks.append(_check(8, 'SSL 证书', expiring == 0,
                         f'{expiring} 个证书将在 30 天内到期' if expiring else '无临期证书',
                         '到 SSL 证书页续期'))

    # ---- 绑定/授权 ----
    try:
        from .. import binding
        st = binding.status()
        bound = st['mode'] == 'bound'
        checks.append(_check(15, '账户绑定状态', bound,
                             f"绑定账户 {st.get('account')}" if bound else f"未正常绑定（{st.get('mode')}）",
                             '到 设置→账户绑定 处理'))
    except Exception:
        checks.append(_check(15, '账户绑定状态', False, '状态读取异常', '联系官网客服'))

    # ---- 完整性 ----
    try:
        from .. import integrity
        m = integrity.load_manifest()
        if 'error' in m:
            checks.append(_check(15, '源码完整性', False, f'清单异常: {m["error"]}',
                                 '重新生成/校验完整性清单'))
        else:
            quick = integrity.startup_check()
            checks.append(_check(15, '源码完整性', quick.get('ok', False),
                                 f'{quick.get("checked", 0)} 个核心文件校验'
                                 + ('通过' if quick.get('ok') else '异常'),
                                 '到 安全中心 执行全盘自检'))
    except Exception:
        checks.append(_check(15, '源码完整性', False, '校验模块不可用'))

    # ---- 安全 ----
    try:
        from ..utils.exec_utils import IS_WIN, run_cmd
        if IS_WIN:
            r = run_cmd('powershell -NoProfile -Command "(Get-NetFirewallProfile | '
                        'Where-Object {$_.Enabled} | Measure-Object).Count"', timeout=20)
            fw = int(r['stdout'].strip() or 0) >= 1
        else:
            r = run_cmd('systemctl is-active firewalld 2>/dev/null || systemctl is-active ufw '
                        '2>/dev/null || iptables -L -n 2>/dev/null | head -n1', timeout=15, shell=True)
            fw = r['code'] == 0
    except Exception:
        fw = False
    checks.append(_check(10, '防火墙状态', fw, '已启用' if fw else '未启用',
                         '启用系统防火墙并按需放行端口'))

    fails_24h = query('SELECT COUNT(*) c FROM login_logs WHERE success=0 AND ts > ?',
                      (_now() - 86400,), one=True)['c']
    checks.append(_check(8, '登录安全', fails_24h < 20,
                         f'近 24 小时 {fails_24h} 次登录失败',
                         '检查登录日志，必要时启用 IP 白名单'))

    # ---- 默认密码 ----
    from ..auth import verify_password
    admin = query('SELECT password_hash FROM users WHERE username=?', ('admin',), one=True)
    default_pwd = bool(admin and verify_password('admin123', admin['password_hash']))
    checks.append(_check(12, '默认密码', not default_pwd,
                         '仍在使用默认密码 admin123！' if default_pwd else '已修改',
                         '立即在右上角菜单修改密码'))

    # ---- 更新 ----
    checks.append(_check(5, '面板版本', True, f"v{cfg.get('version', '1.0.0')}", ''))

    # ---- 评分 ----
    total_weight = sum(c['weight'] for c in checks)
    got = sum(c['weight'] for c in checks if c['ok'])
    score = round(got / total_weight * 100)
    level = '优秀' if score >= 90 else ('良好' if score >= 75 else ('一般' if score >= 60 else '需整改'))
    return {
        'score': score, 'level': level,
        'passed': sum(1 for c in checks if c['ok']),
        'failed': sum(1 for c in checks if not c['ok']),
        'total': len(checks),
        'checks': checks,
        'ts': time.time(),
    }
