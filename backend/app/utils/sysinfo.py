# Created by 小杜 on 2026/08

"""跨平台系统信息采集（psutil + 平台命令）。"""
import os
import platform
import socket
import time

import psutil

from .exec_utils import IS_WIN, run_cmd

_last_net = {'ts': 0.0, 'rx': 0, 'tx': 0}


def _b(v):
    return round(v / 1024 / 1024 / 1024, 2)


def cpu_info() -> dict:
    freq = psutil.cpu_freq()
    return {
        'percent': psutil.cpu_percent(interval=0.1),
        'per_core': psutil.cpu_percent(interval=None, percpu=True),
        'cores': psutil.cpu_count(logical=False),
        'threads': psutil.cpu_count(logical=True),
        'freq_current': round(freq.current, 1) if freq else None,
        'freq_max': round(freq.max, 1) if freq else None,
        'load': list(os.getloadavg()) if hasattr(os, 'getloadavg') else [],
        'times': dict(psutil.cpu_times()._asdict()),
    }


def mem_info() -> dict:
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    return {
        'total': _b(vm.total),
        'used': _b(vm.used),
        'available': _b(vm.available),
        'percent': vm.percent,
        'free': _b(vm.free),
        'buffers': _b(getattr(vm, 'buffers', 0)),
        'cached': _b(getattr(vm, 'cached', 0)),
        'swap_total': _b(sw.total),
        'swap_used': _b(sw.used),
        'swap_percent': sw.percent,
    }


def disk_info() -> list:
    out = []
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except Exception:
            continue
        out.append({
            'device': part.device,
            'mount': part.mountpoint,
            'fstype': part.fstype,
            'total': _b(usage.total),
            'used': _b(usage.used),
            'free': _b(usage.free),
            'percent': usage.percent,
        })
    io = psutil.disk_io_counters()
    return {'partitions': out, 'io': dict(io._asdict()) if io else {}}


def net_info() -> dict:
    global _last_net
    counters = psutil.net_io_counters()
    now_ts = time.time()
    interval = max(now_ts - _last_net['ts'], 0.5)
    rx_rate = (counters.bytes_recv - _last_net['rx']) / interval
    tx_rate = (counters.bytes_sent - _last_net['tx']) / interval
    _last_net = {'ts': now_ts, 'rx': counters.bytes_recv, 'tx': counters.bytes_sent}
    addrs = {}
    for name, snics in psutil.net_if_addrs().items():
        addrs[name] = []
        for snic in snics:
            addrs[name].append({
                'family': str(snic.family),
                'address': snic.address,
                'netmask': snic.netmask,
            })
    stats = psutil.net_if_stats()
    nics = []
    for name, st in stats.items():
        nics.append({
            'name': name,
            'up': st.isup,
            'speed': st.speed,
            'mtu': st.mtu,
            'duplex': str(st.duplex),
            'addrs': addrs.get(name, []),
        })
    return {
        'bytes_sent': counters.bytes_sent,
        'bytes_recv': counters.bytes_recv,
        'rx_rate': rx_rate,
        'tx_rate': tx_rate,
        'nics': nics,
        'connections': len(psutil.net_connections(kind='inet')),
    }


def system_info() -> dict:
    uname = platform.uname()
    boot = psutil.boot_time()
    uptime = time.time() - boot
    hostname = socket.gethostname()
    os_info = {
        'system': uname.system,
        'node': uname.node,
        'release': uname.release,
        'version': uname.version,
        'machine': uname.machine,
        'hostname': hostname,
        'boot_time': boot,
        'uptime': uptime,
        'python': platform.python_version(),
        'platform': 'windows' if IS_WIN else 'linux',
        'arch': platform.machine(),
    }
    if IS_WIN:
        r = run_cmd('wmic os get Caption,Version,OSArchitecture /value', timeout=20)
        for line in r['stdout'].splitlines():
            line = line.strip()
            if '=' in line:
                k, v = line.split('=', 1)
                os_info[k.strip().lower()] = v.strip()
    else:
        r = run_cmd('cat /etc/os-release', timeout=10)
        for line in r['stdout'].splitlines():
            if '=' in line:
                k, v = line.split('=', 1)
                os_info[k.strip().lower()] = v.strip().strip('"')
        r = run_cmd('hostnamectl 2>/dev/null', timeout=10)
        if r['code'] == 0:
            for line in r['stdout'].splitlines():
                if ':' in line:
                    k, v = line.split(':', 1)
                    os_info['host_' + k.strip().lower()] = v.strip()
    return os_info


def gpu_info() -> list:
    out = []
    if IS_WIN:
        r = run_cmd('wmic path win32_VideoController get Name,AdapterRAM,DriverVersion /value',
                    timeout=30)
        cur = {}
        for line in r['stdout'].splitlines():
            line = line.strip()
            if not line:
                if cur:
                    out.append(cur)
                    cur = {}
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                cur[k.strip().lower()] = v.strip()
        if cur:
            out.append(cur)
    else:
        r = run_cmd('lspci 2>/dev/null | grep -iE "vga|3d|display"', timeout=20)
        for line in r['stdout'].splitlines():
            out.append({'name': line.strip()})
    return out


def overview() -> dict:
    return {
        'cpu': cpu_info(),
        'mem': mem_info(),
        'disk': disk_info(),
        'net': net_info(),
        'system': system_info(),
        'gpu': gpu_info(),
        'ts': time.time(),
    }
