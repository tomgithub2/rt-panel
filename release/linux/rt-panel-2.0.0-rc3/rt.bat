@echo off
chcp 65001 >nul
rem RT面板 命令行管理器（Windows）：双击本文件或命令行输入 rt 即可
setlocal
set HERE=%~dp0
if exist "%HERE%backend\rtcli.py" (
    python "%HERE%backend\rtcli.py" %*
) else if defined RT_PANEL_DIR (
    python "%RT_PANEL_DIR%\backend\rtcli.py" %*
) else (
    echo 未找到 rtcli.py，可设置 RT_PANEL_DIR 指向面板安装目录
)
if "%~1"=="" pause
