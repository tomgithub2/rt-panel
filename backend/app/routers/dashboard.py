"""仪表盘：实时概览 + WebSocket 实时指标推送。"""
import asyncio
import json
import time

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from ..auth import get_current_user
from ..config import PANEL_VERSION, get_config
from ..database import now, query
from ..utils import sysinfo

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])


@router.get('/overview')
def overview(user: dict = Depends(get_current_user)):
    data = sysinfo.overview()
    data['panel'] = {
        'version': PANEL_VERSION,
        'site_name': get_config().get('site_name', 'RT面板'),
        'started_at': getattr(router, '_started_at', now()),
        'is_admin': user['role'] == 'admin',
        'elevated': True,
    }
    data['counts'] = {
        'users': query('SELECT COUNT(*) c FROM users', one=True)['c'],
        'cron_jobs': query('SELECT COUNT(*) c FROM cron_jobs WHERE enabled=1', one=True)['c'],
        'websites': query('SELECT COUNT(*) c FROM websites', one=True)['c'],
        'backup_tasks': query('SELECT COUNT(*) c FROM backup_tasks', one=True)['c'],
        'alerts_today': query("SELECT COUNT(*) c FROM alert_history WHERE ts > ?",
                              (now() - 86400,), one=True)['c'],
    }
    return data


@router.get('/sparkline')
def sparkline(minutes: int = 30, user: dict = Depends(get_current_user)):
    """仪表盘迷你曲线数据（原始采样）。"""
    since = now() - minutes * 60
    rows = query(
        'SELECT ts,cpu,mem,net_rx,net_tx FROM metric_raw WHERE ts>? ORDER BY ts ASC',
        (since,))
    return {'list': rows}


@router.websocket('/ws/realtime')
async def ws_realtime(ws: WebSocket):
    """实时推送：每 2 秒发送 {cpu,mem,net_rx,net_tx,load1,ts}。"""
    await ws.accept()
    try:
        while True:
            try:
                vm = sysinfo.psutil.virtual_memory()
                net = sysinfo.psutil.net_io_counters()
                load = sysinfo.os.getloadavg() if hasattr(sysinfo.os, 'getloadavg') else (0, 0, 0)
                payload = {
                    'ts': time.time(),
                    'cpu': sysinfo.psutil.cpu_percent(interval=None),
                    'mem': vm.percent,
                    'net_rx': net.bytes_recv,
                    'net_tx': net.bytes_sent,
                    'load1': load[0] if load else 0,
                }
                await ws.send_text(json.dumps(payload))
            except Exception:
                break
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
