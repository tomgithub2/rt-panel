@echo off
chcp 65001 >nul
title RT面板 Windows 安装程序
setlocal EnableExtensions

echo.
echo ==============================================
echo   RT面板 RT Panel - Windows 安装程序
echo ==============================================
echo.

:: ---------- 1. 管理员权限 ----------
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] 请求管理员权限...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: ---------- 2. 安装目录 ----------
set "INSTALL_DIR=%ProgramFiles%\RTPanel"
echo [*] 安装到: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [*] 复制面板文件...
xcopy /E /I /Y /Q "%~dp0panel\*" "%INSTALL_DIR%\" >nul

:: ---------- 3. 检测 Python ----------
set "PY="
py -3 -c "import sys" >nul 2>&1 && set "PY=py -3"
if not defined PY (
    python -c "import sys" >nul 2>&1 && set "PY=python"
)
if not defined PY (
    echo [!] 未检测到 Python，尝试通过 winget 安装 Python 3.13...
    winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo [错误] 自动安装失败，请手动安装 Python 3.8+ https://www.python.org/downloads/
        echo        安装时请勾选 "Add Python to PATH"，然后重新运行本安装程序。
        pause
        exit /b 1
    )
    set "PY=py -3"
)

:: ---------- 4. 安装依赖 ----------
echo [*] 安装 Python 依赖（首次约 1-2 分钟）...
cd /d "%INSTALL_DIR%\backend"
if not exist ".deps\fastapi" (
    %PY% -m pip install -r requirements.txt --target .deps -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet
    if errorlevel 1 %PY% -m pip install -r requirements.txt --target .deps --quiet
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
)

:: ---------- 5. 写入配置 ----------
:: 官网地址：部署官网到云服务器后，把下面地址改成你的域名
set "ACCOUNT_SERVER=https://www.rt888.icu"
if not exist "%INSTALL_DIR%\backend\data" mkdir "%INSTALL_DIR%\backend\data"
> "%INSTALL_DIR%\backend\data\config.json" (
    echo {
    echo   "port": 8000,
    echo   "bind_host": "0.0.0.0",
    echo   "site_name": "RT面板",
    echo   "account_server": "%ACCOUNT_SERVER%",
    echo   "theme": "blackgold"
    echo }
)

:: 生成网页初始化令牌（安装完成后在浏览器完成管理员账号 + 官网账户配置）
for /f %%i in ('powershell -NoProfile -Command "-join (1..8 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })"') do set "SETUP_TOKEN=%%i"
> "%INSTALL_DIR%\backend\data\setup_token.txt" echo %SETUP_TOKEN%

:: ---------- 6. 启动器 ----------
> "%INSTALL_DIR%\start-panel.cmd" (
    echo @echo off
    echo title RT面板
    echo cd /d "%INSTALL_DIR%\backend"
    echo %PY% run.py
)

:: rt 命令行工具 + 自动加入系统 PATH（rt 命令全局可用）
if exist "%~dp0rt.cmd" copy /Y "%~dp0rt.cmd" "%INSTALL_DIR%\rt.cmd" >nul
powershell -NoProfile -Command ^
  "$cur = [Environment]::GetEnvironmentVariable('Path','Machine');" ^
  "if ($cur -notlike '*%INSTALL_DIR%*') { [Environment]::SetEnvironmentVariable('Path', $cur + ';%INSTALL_DIR%', 'Machine'); Write-Host '[OK] rt 命令已加入系统 PATH（新开终端即可使用 rt）' } else { Write-Host '[OK] rt 命令已在 PATH 中' }"

:: ---------- 7. 开机自启（计划任务） ----------
echo [*] 注册开机自启服务...
schtasks /create /tn "RTPanel" /tr "%INSTALL_DIR%\start-panel.cmd" /sc onstart /ru SYSTEM /rl highest /f >nul 2>&1
if errorlevel 1 (
    echo [!] 开机自启注册失败（不影响安装），可稍后手动注册
) else (
    echo [OK] 开机自启已注册（任务计划: RTPanel）
)

:: ---------- 8. 快捷方式 ----------
echo [*] 创建快捷方式...
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s1 = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RT面板.lnk');" ^
  "$s1.TargetPath = '%INSTALL_DIR%\start-panel.cmd';" ^
  "$s1.WorkingDirectory = '%INSTALL_DIR%';" ^
  "$s1.Description = 'RT面板 - 高端服务器运维面板';" ^
  "$s1.Save();" ^
  "$sm = [Environment]::GetFolderPath('StartMenu') + '\Programs\RT面板';" ^
  "New-Item -ItemType Directory -Force -Path $sm | Out-Null;" ^
  "$s2 = $ws.CreateShortcut($sm + '\RT面板.lnk');" ^
  "$s2.TargetPath = '%INSTALL_DIR%\start-panel.cmd';" ^
  "$s2.WorkingDirectory = '%INSTALL_DIR%';" ^
  "$s2.Save()"

:: ---------- 9. 立即启动 ----------
echo [*] 启动面板...
schtasks /run /tn "RTPanel" >nul 2>&1
start "" "%INSTALL_DIR%\start-panel.cmd"

:: ---------- 10. 完成 ----------
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set "IP=%%a"
echo.
echo ==============================================
echo   安装完成！
echo ----------------------------------------------
echo   访问地址:  http://127.0.0.1:8000
echo   初始化令牌: %SETUP_TOKEN%  （仅用于首次网页初始化）
echo ----------------------------------------------
echo   下一步:    浏览器打开访问地址 - 输入初始化令牌 -
echo              在网页上设置管理员用户名/密码，
echo              并可绑定RT面板官网账户
echo              免费版可绑 2 台 / 付费版可绑 10 台
echo ----------------------------------------------
echo   重新查看令牌: type "%INSTALL_DIR%\backend\data\setup_token.txt"
echo   已创建:    桌面快捷方式 / 开始菜单 / 开机自启
echo ==============================================
echo.
pause
