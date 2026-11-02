@echo off
rem TRUCKPULSE - instalacao (dependencias, build, testes e plugin do ETS2)
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=pwsh"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" -WithPlugin %*
pause
