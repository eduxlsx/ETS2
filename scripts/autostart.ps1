<#
.SYNOPSIS
  Liga/desliga a inicialização automática do TRUCKPULSE com o Windows.
  (Também pode ser feito em Configurações > "Iniciar o TRUCKPULSE com o Windows".)
.PARAMETER Disable  Remove a inicialização automática.
#>
param([switch]$Disable)
. "$PSScriptRoot\common.ps1"
$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\TruckPulse.cmd'
if ($Disable) {
    Remove-Item $startup -ErrorAction SilentlyContinue
    Write-Ok 'Inicialização automática desativada.'
} else {
    $script = Join-Path $PSScriptRoot 'start.ps1'
    "@echo off`r`nrem Criado pelo TRUCKPULSE`r`nstart `"`" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`" -NoBrowser`r`n" | Set-Content -Path $startup -Encoding ascii
    Write-Ok "Inicialização automática ativada ($startup)."
}
