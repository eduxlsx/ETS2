@echo off
rem TRUCKPULSE - verificacao do SDK e da conexao com o ETS2
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=pwsh"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\check.ps1"
pause
