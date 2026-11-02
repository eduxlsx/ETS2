<#
.SYNOPSIS
  Instala o plugin de telemetria scs-sdk-plugin (V.1.12.1) no Euro Truck Simulator 2.

.DESCRIPTION
  Baixa a release oficial do GitHub (RenCloud/scs-sdk-plugin), confere o hash do
  scs-telemetry.dll de 64 bits e copia para <ETS2>\bin\win_x64\plugins.
  Reinicie o jogo depois — o plugin só é carregado na inicialização.

.PARAMETER GamePath
  Pasta do Euro Truck Simulator 2 (opcional; detectada automaticamente).
#>
param([string]$GamePath)
. "$PSScriptRoot\common.ps1"

$Url = 'https://github.com/RenCloud/scs-sdk-plugin/releases/download/V.1.12.1/release_v_1_12_1.zip'
$ExpectedSha256 = '1D03DBC7A975E72203C60A7B9998021CEB8800B836BF28A131279979AD386CD4'

Write-Step 'Localizando o Euro Truck Simulator 2'
if (-not $GamePath) { $GamePath = Find-Ets2Path }
if (-not $GamePath -or -not (Test-Path $GamePath)) {
    Write-Fail 'Não encontrei o ETS2. Rode novamente com: .\install-plugin.ps1 -GamePath "D:\...\Euro Truck Simulator 2"'
    exit 1
}
Write-Ok $GamePath
$PluginDir = Join-Path $GamePath 'bin\win_x64\plugins'
$Target = Join-Path $PluginDir 'scs-telemetry.dll'

if (Test-Path $Target) {
    $hash = (Get-FileHash $Target -Algorithm SHA256).Hash
    if ($hash -eq $ExpectedSha256) {
        Write-Ok 'O plugin V.1.12.1 já está instalado.'
        exit 0
    }
    Write-Warn2 "Já existe um scs-telemetry.dll diferente (SHA256 $hash). Ele será substituído (cópia de segurança .bak)."
    Copy-Item $Target "$Target.bak" -Force
}

Write-Step 'Baixando a release oficial do GitHub'
$tmp = Join-Path $env:TEMP ("truckpulse-plugin-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $Url -OutFile (Join-Path $tmp 'plugin.zip') -UseBasicParsing
    Expand-Archive (Join-Path $tmp 'plugin.zip') (Join-Path $tmp 'x') -Force
    $dll = Get-ChildItem (Join-Path $tmp 'x') -Recurse -Filter 'scs-telemetry.dll' | Where-Object { $_.DirectoryName -match 'Win64' } | Select-Object -First 1
    if (-not $dll) { throw 'scs-telemetry.dll (Win64) não encontrado no pacote.' }
    $hash = (Get-FileHash $dll.FullName -Algorithm SHA256).Hash
    if ($hash -ne $ExpectedSha256) { throw "Hash inesperado ($hash). Download abortado por segurança." }
    Write-Ok 'Hash SHA256 conferido'

    New-Item -ItemType Directory -Force -Path $PluginDir | Out-Null
    Copy-Item $dll.FullName $Target -Force
    Write-Ok "Instalado em $Target"
    if (Get-Process eurotrucks2 -ErrorAction SilentlyContinue) {
        Write-Warn2 'O jogo está aberto: feche e abra novamente para carregar o plugin.'
    }
    Write-Host "`nNa próxima abertura o jogo mostrará um aviso sobre 'SDK features' — confirme com OK." -ForegroundColor Gray
} finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
