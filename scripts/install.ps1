<#
.SYNOPSIS
  Instala as dependências e compila o TRUCKPULSE.

.PARAMETER WithPlugin    Também instala o plugin de telemetria no ETS2.
.PARAMETER WithElectron  Também instala o Electron (aplicativo desktop).
.PARAMETER SkipTests     Não roda os testes unitários.
#>
param([switch]$WithPlugin, [switch]$WithElectron, [switch]$SkipTests)
. "$PSScriptRoot\common.ps1"
Set-Location $Root

Write-Host "TRUCKPULSE — instalação" -ForegroundColor White

Write-Step 'Verificando o Node.js'
Assert-Node

Write-Step 'Instalando dependências (npm install)'
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Write-Fail 'npm install falhou'; exit 1 }

Write-Step 'Compilando servidor e painel'
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail 'build falhou'; exit 1 }
Write-Ok 'Build concluído'

if (-not $SkipTests) {
    Write-Step 'Rodando os testes unitários'
    npm test
    if ($LASTEXITCODE -ne 0) { Write-Warn2 'Algum teste falhou — veja a saída acima.' } else { Write-Ok 'Testes OK' }
}

if ($WithElectron) {
    Write-Step 'Instalando o Electron (opcional)'
    Push-Location (Join-Path $Root 'electron')
    npm install --no-fund --no-audit
    Pop-Location
}

Write-Step 'Plugin de telemetria'
$game = Find-Ets2Path
if ($game) {
    $dll = Join-Path $game 'bin\win_x64\plugins\scs-telemetry.dll'
    if (Test-Path $dll) { Write-Ok "Plugin encontrado: $dll" }
    elseif ($WithPlugin) { & "$PSScriptRoot\install-plugin.ps1" -GamePath $game }
    else { Write-Warn2 "Plugin não instalado. Rode: scripts\install-plugin.ps1" }
} else {
    Write-Warn2 'ETS2 não localizado automaticamente. Instale o plugin com scripts\install-plugin.ps1 -GamePath "<pasta do jogo>"'
}

Write-Host "`nPronto! Inicie com INICIAR.bat (ou scripts\start.ps1)." -ForegroundColor Green
