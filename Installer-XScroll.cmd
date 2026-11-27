@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-XScroll.ps1"
if errorlevel 1 (
  echo Impossible de preparer XScroll. Les details figurent ci-dessus.
  pause
  exit /b 1
)
echo.
pause
