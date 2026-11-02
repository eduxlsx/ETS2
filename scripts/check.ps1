<#
.SYNOPSIS
  Verifica o ambiente: Node, plugin do SDK, jogo em execução e conexão real com a telemetria.
#>
. "$PSScriptRoot\common.ps1"
Set-Location $Root
Assert-Node

$game = Find-Ets2Path
if ($game) {
    Write-Ok "ETS2: $game"
    $dll = Join-Path $game 'bin\win_x64\plugins\scs-telemetry.dll'
    if (Test-Path $dll) { Write-Ok "Plugin: $dll" } else { Write-Fail "Plugin ausente em $dll (rode scripts\install-plugin.ps1)" }
} else {
    Write-Warn2 'ETS2 não localizado automaticamente.'
}

if (-not (Test-Path (Join-Path $Root 'server\dist\server\src\tools\check.js'))) { npm run build -w server | Out-Null }
node --disable-warning=ExperimentalWarning server/dist/server/src/tools/check.js
