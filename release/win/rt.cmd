@echo off
rem RT Panel Windows command-line manager (self-developed, like BaoTa bt)
rem Usage: rt [status|start|stop|restart|info|help]
chcp 65001 >nul
set "INSTALL_DIR=%ProgramFiles%\RTPanel"

if "%1"=="status" goto status
if "%1"=="restart" goto restart
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="info" goto info
if "%1"=="help" goto help
if "%1"=="" goto menu
echo Unknown command: %1 (run rt for help)
exit /b 1

:status
schtasks /query /tn RTPanel 2>nul | findstr /c:"Ready" >nul && (
  echo [RUNNING] RT Panel task registered
) || (
  echo [STOPPED] Scheduled task RTPanel not running
)
netstat -ano | findstr /c:":8000 " | findstr /c:"LISTENING" >nul && echo [LISTENING] port 8000
exit /b 0

:restart
schtasks /end /tn RTPanel >nul 2>&1
timeout /t 2 /nobreak >nul
schtasks /run /tn RTPanel >nul 2>&1
echo [OK] Panel restarted (visit in about 3s)
exit /b 0

:start
schtasks /run /tn RTPanel >nul 2>&1
echo [OK] Panel started
exit /b 0

:stop
schtasks /end /tn RTPanel >nul 2>&1
echo [OK] Panel stopped
exit /b 0

:info
echo Install dir : %INSTALL_DIR%
echo Access URL  : http://127.0.0.1:8000
echo Config dir  : %INSTALL_DIR%\backend\data
echo Auto start  : Scheduled task RTPanel
exit /b 0

:menu
echo.
echo   ========== RT Panel CLI Manager ==========
echo   rt status    show panel status
echo   rt start     start panel
echo   rt stop      stop panel
echo   rt restart   restart panel
echo   rt info      show panel info
echo   rt help      show help
echo.
exit /b 0

:help
echo Usage: rt [status^|start^|stop^|restart^|info^|help]
exit /b 0
