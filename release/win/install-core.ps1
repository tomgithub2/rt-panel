# RT面板 Windows 安装核心逻辑（由 setup.hta 图形向导调用，也可静默运行）
param(
    [string]$InstallDir = "$env:ProgramFiles\RTPanel",
    [string]$LogFile = "$env:TEMP\rt-install.log",
    [string]$AccountServer = "https://www.rt888.icu",
    [int]$Port = 8000
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Content -Path $LogFile -Value '' -Encoding UTF8

# 端口校验：无效则回退默认 8000
if ($Port -lt 1 -or $Port -gt 65535) {
    Log "端口 $Port 无效，使用默认端口 8000"
    $Port = 8000
}

function Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

# ---------- 1. 管理员权限 ----------
Log '检查管理员权限…'
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Log '错误: 需要管理员权限，请以管理员身份运行'
    exit 1
}
Log '管理员权限 OK'

# ---------- 2. 复制文件 ----------
Log "复制面板文件到 $InstallDir …"
try {
    $src = Join-Path $PSScriptRoot 'panel'
    if (-not (Test-Path $src)) { throw "未找到 panel 目录（$src）" }
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Copy-Item -Path (Join-Path $src '*') -Destination $InstallDir -Recurse -Force
    Log '文件复制完成'
} catch {
    Log "错误: $($_.Exception.Message)"
    exit 1
}

# ---------- 3. 安装系统运行环境（VC++ 运行库） ----------
Log '安装系统运行环境（VC++ Redistributable）…'
try {
    $vcredist = "$env:TEMP\vc_redist.x64.exe"
    # 已安装则跳过
    $vcInstalled = $false
    $vcKey = 'HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64'
    if (Test-Path $vcKey) {
        $v = Get-ItemProperty $vcKey -ErrorAction SilentlyContinue
        if ($v -and $v.Installed -eq 1) { $vcInstalled = $true }
    }
    if (-not $vcInstalled) {
        Log '下载 VC++ 2015-2022 运行库（约 25MB）…'
        Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vc_redist.x64.exe' -OutFile $vcredist -UseBasicParsing
        Log '静默安装 VC++ 运行库…'
        Start-Process -FilePath $vcredist -ArgumentList '/install','/quiet','/norestart' -Wait
        Remove-Item $vcredist -Force -ErrorAction SilentlyContinue
        Log 'VC++ 运行库安装完成'
    } else {
        Log 'VC++ 运行库已存在，跳过'
    }
} catch {
    Log "警告: VC++ 运行库安装失败（$($_.Exception.Message)），不影响面板运行"
}

# ---------- 4. 检测/安装 Python ----------
Log '检测 Python 环境…'
$pyCmd = $null
foreach ($cand in @('py', 'python', 'python3')) {
    $c = Get-Command $cand -ErrorAction SilentlyContinue
    if ($c) {
        $pyCmd = $c.Source
        break
    }
}
if (-not $pyCmd) {
    Log '未检测到 Python，尝试 winget 安装 Python 3.13（约 2-5 分钟）…'
    $w = Get-Command winget -ErrorAction SilentlyContinue
    if ($w) {
        & winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements --silent | Out-Null
        $pyCmd = (Get-Command py -ErrorAction SilentlyContinue).Source
    }
    if (-not $pyCmd) {
        Log '错误: 自动安装 Python 失败，请手动安装 https://www.python.org/downloads/ （勾选 Add to PATH）后重试'
        exit 1
    }
    Log 'Python 3.13 安装完成'
} else {
    Log "Python 已就绪: $pyCmd"
}

# ---------- 5. 安装面板依赖 ----------
$depsDir = Join-Path $InstallDir 'backend\.deps'
if (-not (Test-Path (Join-Path $depsDir 'fastapi'))) {
    Log '安装面板依赖（首次约 1-2 分钟，走清华镜像）…'
    Push-Location (Join-Path $InstallDir 'backend')
    & $pyCmd -m pip install -r requirements.txt --target .deps -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet
    if ($LASTEXITCODE -ne 0) {
        & $pyCmd -m pip install -r requirements.txt --target .deps --quiet
    }
    Pop-Location
    if (-not (Test-Path (Join-Path $depsDir 'fastapi'))) {
        Log '错误: 依赖安装失败，请检查网络后重新运行安装程序'
        exit 1
    }
} else {
    Log '依赖已存在，跳过'
}
Log '依赖安装完成'

# ---------- 6. 写入配置 ----------
Log "写入面板配置（端口 $Port）…"
$dataDir = Join-Path $InstallDir 'backend\data'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$cfg = @{
    port = $Port
    bind_host = '0.0.0.0'
    site_name = 'RT面板'
    account_server = $AccountServer
    theme = 'blackgold'
} | ConvertTo-Json
Set-Content -Path (Join-Path $dataDir 'config.json') -Value $cfg -Encoding UTF8

# 生成网页初始化令牌（安装完成后在浏览器完成管理员账号 + 官网账户配置）
$tokenBytes = New-Object byte[] 8
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($tokenBytes)
$setupToken = ($tokenBytes | ForEach-Object { $_.ToString('x2') }) -join ''
Set-Content -Path (Join-Path $dataDir 'setup_token.txt') -Value $setupToken -Encoding ASCII
Log "初始化令牌: $setupToken（仅用于首次网页初始化，用完即焚）"

# ---------- 7. 启动器 ----------
Log '创建启动器…'
$launcher = Join-Path $InstallDir 'start-panel.cmd'
@"
@echo off
chcp 65001 >nul
title RT面板
cd /d "$(Join-Path $InstallDir 'backend')"
"$pyCmd" run.py
"@ | Set-Content -Path $launcher -Encoding UTF8

# rt 命令行管理工具（类宝塔 bt 命令）
$rtSrc = Join-Path $PSScriptRoot 'rt.cmd'
if (Test-Path $rtSrc) {
    Copy-Item -Path $rtSrc -Destination (Join-Path $InstallDir 'rt.cmd') -Force
    Log 'rt 命令行工具已部署（rt.cmd）'
    # 自动加入系统 PATH，使 rt 命令全局可用
    try {
        $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
        if ($machinePath -notlike "*$InstallDir*") {
            [Environment]::SetEnvironmentVariable('Path', "$machinePath;$InstallDir", 'Machine')
            Log "rt 命令已加入系统 PATH（$InstallDir，新开终端即可使用 rt）"
        } else {
            Log 'rt 命令已在系统 PATH 中'
        }
    } catch {
        Log "警告: 写入系统 PATH 失败（$($_.Exception.Message)），可手动添加 $InstallDir"
    }
}

# ---------- 8. 开机自启 ----------
Log '注册开机自启（计划任务）…'
$taskName = 'RTPanel'
& schtasks /create /tn $taskName /tr "`"$launcher`"" /sc onstart /ru SYSTEM /rl highest /f 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Log '开机自启注册成功'
} else {
    Log '警告: 开机自启注册失败（不影响使用，可在任务计划程序中手动创建）'
}

# ---------- 9. 快捷方式 ----------
Log '创建桌面/开始菜单快捷方式…'
try {
    $ws = New-Object -ComObject WScript.Shell
    $desktop = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RT面板.lnk')
    $desktop.TargetPath = $launcher
    $desktop.WorkingDirectory = $InstallDir
    $desktop.Description = 'RT面板 - 高端服务器运维面板'
    $desktop.Save()

    $smDir = [Environment]::GetFolderPath('StartMenu') + '\Programs\RT面板'
    New-Item -ItemType Directory -Force -Path $smDir | Out-Null
    $sm = $ws.CreateShortcut("$smDir\RT面板.lnk")
    $sm.TargetPath = $launcher
    $sm.WorkingDirectory = $InstallDir
    $sm.Save()
    Log '快捷方式创建完成'
} catch {
    Log "警告: 快捷方式创建失败（$($_.Exception.Message)）"
}

# ---------- 10. 启动面板 ----------
Log '启动面板服务…'
& schtasks /run /tn $taskName 2>&1 | Out-Null
Log "安装流程全部完成。访问 http://服务器IP:$Port 输入初始化令牌 $setupToken 完成网页初始化"
exit 0
