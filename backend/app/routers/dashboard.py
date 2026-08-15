# Created by 小杜 on 2026/08

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

# 实时推送频率（秒）：太密会刷爆前端，太疏没实时感
_WS_TICK = 2
# 告警只按最近一天算，跨天不重复计
_TODAY_WINDOW = 86400


@router.get('/overview')
def overview(user: dict = Depends(get_current_user)):
    data = sysinfo.overview()
    if not data:
        data = {}
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
                              (now() - _TODAY_WINDOW, ), one=True)['c'],
    }
    return data
@router.get('/sparkline')
def sparkline(minutes: int = 30, user: dict = Depends(get_current_user)):
    """仪表盘迷你曲线数据（原始采样）。"""
    sinceTs = now() - minutes * 60
    rowsList = query(
        'SELECT ts,cpu,mem,net_rx,net_tx FROM metric_raw WHERE ts>? ORDER BY ts ASC',
        (sinceTs,))
    return {'list': rowsList}


@router.websocket('/ws/realtime')
async def ws_realtime(ws: WebSocket):
    """实时推送：每 2 秒发送 {cpu,mem,net_rx,net_tx,load1,ts}。"""
    await ws.accept()
    try:
        while True:
            try:
                memInfo = sysinfo.psutil.virtual_memory()
                netIo = sysinfo.psutil.net_io_counters()
                loadAvg = sysinfo.os.getloadavg() if hasattr(sysinfo.os, 'getloadavg') else (0, 0, 0)
                pushBody = {
                    'ts': time.time(),
                    'cpu': sysinfo.psutil.cpu_percent(interval=None),
                    'mem': memInfo.percent,
                    'net_rx': netIo.bytes_recv,
                    'net_tx': netIo.bytes_sent,
                    'load1': loadAvg[0] if loadAvg else 0,
                }
                await ws.send_text(json.dumps(pushBody))
            except Exception:
                break
            # 卧槽，不加这个延时前端 chart 会被推刷到卡死，先这样顶着
            await asyncio.sleep(_WS_TICK)
    except WebSocketDisconnect:
        pass
