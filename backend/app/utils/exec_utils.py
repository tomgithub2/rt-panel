"""跨平台命令执行工具。"""
import os
import shlex
import subprocess
import sys

IS_WIN = sys.platform == 'win32'


def run_cmd(cmd, timeout=30, shell=None, cwd=None, input_text=None) -> dict:
    """执行命令，返回 {code, stdout, stderr}。"""
    if shell is None:
        shell = IS_WIN
    if isinstance(cmd, str):
        if shell:
            args = cmd
        else:
            args = shlex.split(cmd)
    else:
        args = cmd
    try:
        if input_text is not None:
            proc = subprocess.run(
                args, shell=shell, cwd=cwd, input=input_text.encode('utf-8', 'ignore'),
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        else:
            proc = subprocess.run(
                args, shell=shell, cwd=cwd,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        return {
            'code': proc.returncode,
            'stdout': _decode(proc.stdout),
            'stderr': _decode(proc.stderr),
        }
    except subprocess.TimeoutExpired as e:
        out = _decode(e.stdout) if e.stdout else ''
        err = _decode(e.stderr) if e.stderr else ''
        return {'code': -1, 'stdout': out, 'stderr': err + '\n[timeout]', 'timeout': True}
    except FileNotFoundError:
        return {'code': -2, 'stdout': '', 'stderr': 'command not found', 'notfound': True}
    except Exception as e:
        return {'code': -3, 'stdout': '', 'stderr': str(e)}


def _decode(b) -> str:
    if not b:
        return ''
    for enc in ('utf-8', 'gbk', 'latin-1'):
        try:
            return b.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return str(b)


def which(name: str) -> str:
    return shutil_which(name)


def shutil_which(name: str) -> str:
    import shutil
    return shutil.which(name) or ''


def is_elevated() -> bool:
    if IS_WIN:
        try:
            import ctypes
            return bool(ctypes.windll.shell32.IsUserAnAdmin())
        except Exception:
            return False
    else:
        try:
            return os.geteuid() == 0
        except AttributeError:
            return False
