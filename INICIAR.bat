@echo off
rem TRUCKPULSE - inicia o servidor e abre o painel no navegador
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=pwsh"
"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" %*
