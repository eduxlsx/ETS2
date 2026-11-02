<#
.SYNOPSIS
  Inicia o TRUCKPULSE (servidor + painel no navegador ou no Electron).

.PARAMETER Demo       Inicia direto no MODO DEMO (dados simulados).
.PARAMETER NoBrowser  Não abre o navegador (usado na inicialização com o Windows).
.PARAMETER Electron   Abre o painel no aplicativo desktop (Electron).
.PARAMETER Port       Porta HTTP (padrão 5170).
#>
param([switch]$Demo, [switch]$NoBrowser, [switch]$Electron, [int]$Port = 5170)
. "$PSScriptRoot\common.ps1"
Set-Location $Root

Assert-Node
if (-not (Test-Path (Join-Path $Root 'server\dist\server\src\index.js')) -or -not (Test-Path (Join-Path $Root 'web\dist\index.html'))) {
    Write-Warn2 'Build não encontrado — compilando…'
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Fail 'build falhou'; exit 1 }
}

$env:TRUCKPULSE_PORT = "$Port"
$url = "http://localhost:$Port"

if ($Electron) {
    $electronDir = Join-Path $Root 'electron'
    if (-not (Test-Path (Join-Path $electronDir 'node_modules'))) {
        Write-Step 'Instalando o Electron (primeira execução)'
        Push-Location $electronDir; npm install --no-fund --no-audit; Pop-Location
    }
    if ($Demo) { $env:TRUCKPULSE_DEMO = '1' }
    Push-Location $electronDir
    npx electron .
    Pop-Location
    exit $LASTEXITCODE
}

$nodeArgs = @('--disable-warning=ExperimentalWarning', 'server/dist/server/src/index.js')
if ($Demo) { $nodeArgs += '--demo' }

if (-not $NoBrowser) {
    # abre o navegador assim que o servidor responder
    Start-Job -ScriptBlock {
        param($u)
        for ($i = 0; $i -lt 40; $i++) {
            try { Invoke-WebRequest "$u/api/status" -UseBasicParsing -TimeoutSec 1 | Out-Null; Start-Process $u; return } catch { Start-Sleep -Milliseconds 500 }
        }
    } -ArgumentList $url | Out-Null
}

Write-Host "TRUCKPULSE em $url  (Ctrl+C para encerrar)" -ForegroundColor Cyan
& node @nodeArgs
