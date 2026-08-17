"""Web 终端：pty 会话 + WebSocket 转发。"""
import asyncio
import json
import os
import sys
import threading
import time

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from ..auth import decode_token, get_current_user
from ..audit import audit
from ..database import query
from ..rbac import role_permissions

router = APIRouter(tags=['terminal'])


class PtySession:
    """跨平台伪终端封装（Linux: pty / Windows: pywinpty）。"""

    def __init__(self, cols: int = 120, rows: int = 32):
        self.cols = cols
        self.rows = rows
        self.proc = None
        self._start()

    def _start(self):
        if sys.platform == 'win32':
            from winpty import PtyProcess
            self.proc = PtyProcess.spawn(
                'powershell.exe', dimensions=(self.rows, self.cols),
                env=None, cwd=os.path.expanduser('~'))
        else:
            import pty
            shell = os.environ.get('SHELL', '/bin/bash')
            pid, fd = pty.fork()
            if pid == 0:
                os.chdir(os.path.expanduser('~'))
                os.execvp(shell, [shell, '-l'])
            self.proc = _LinuxPty(pid, fd)

    def resize(self, rows: int, cols: int):
        self.rows, self.cols = rows, cols
        if sys.platform == 'win32':
            try:
                self.proc.setwinsize(rows, cols)
            except Exception:
                pass
        else:
            try:
                import fcntl
                import struct
                import termios
                fcntl.ioctl(self.proc.fd, termios.TIOCSWINSZ,
                            struct.pack('HHHH', rows, cols, 0, 0))
            except Exception:
                pass

    def write(self, data: str):
        try:
            self.proc.write(data)
        except Exception:
            pass

    def read(self) -> str:
        try:
            if sys.platform == 'win32':
                return self.proc.read(65536)
            import select
            while True:
                r, _, _ = select.select([self.proc.fd], [], [], 0.1)
                if r:
                    return os.read(self.proc.fd, 65536).decode('utf-8', 'ignore')
                return ''
        except Exception:
            return ''

    def kill(self):
        try:
            self.proc.close()
        except Exception:
            pass


class _LinuxPty:
    def __init__(self, pid, fd):
        self.pid = pid
        self.fd = fd

    def write(self, data):
        os.write(self.fd, data.encode('utf-8', 'ignore'))

    def close(self):
        try:
            os.close(self.fd)
        except OSError:
            pass


@router.websocket('/ws/terminal')
async def ws_terminal(ws: WebSocket):
    """?token=JWT 鉴权后建立终端会话。"""
    token = ws.query_params.get('token', '')
    try:
        payload = decode_token(token)
        user = query('SELECT * FROM users WHERE id=? AND status=1',
                     (payload.get('uid'),), one=True)
        if not user or (user['role'] != 'admin' and
                        'terminal:use' not in role_permissions(user['role'])):
            await ws.close(code=4403)
            return
    except Exception:
        await ws.close(code=4401)
        return
    await ws.accept()
    session = None
    try:
        session = PtySession()
    except Exception as e:
        await ws.send_text(json.dumps({'type': 'exit', 'msg': f'终端启动失败: {e}'}))
        await ws.close()
        return
    audit(user['username'], ws.client.host if ws.client else '',
          'terminal_open', '打开 Web 终端')
    loop = asyncio.get_event_loop()
    stop = threading.Event()

    def reader():
        while not stop.is_set():
            try:
                data = session.read()
                if data:
                    asyncio.run_coroutine_threadsafe(
                        ws.send_text(json.dumps({'type': 'out', 'data': data})), loop)
                time.sleep(0.05)
            except Exception:
                break
        asyncio.run_coroutine_threadsafe(
            ws.send_text(json.dumps({'type': 'exit', 'msg': '会话结束'})), loop)

    threading.Thread(target=reader, daemon=True).start()
    try:
        while True:
            msg = await ws.receive_text()
            obj = json.loads(msg)
            if obj.get('type') == 'in':
                session.write(obj.get('data', ''))
            elif obj.get('type') == 'resize':
                session.resize(int(obj.get('rows', 32)), int(obj.get('cols', 120)))
            elif obj.get('type') == 'ping':
                pass
    except WebSocketDisconnect:
        pass
    finally:
        stop.set()
        try:
            session.kill()
        except Exception:
            pass
