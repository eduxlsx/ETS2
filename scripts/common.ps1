# Funções compartilhadas pelos scripts do TRUCKPULSE.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [X]  $msg" -ForegroundColor Red }

function Test-Node {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { return $null }
    $v = (& node -v).TrimStart('v')
    return [version]($v -replace '-.*$', '')
}

function Assert-Node {
    $v = Test-Node
    if (-not $v) {
        Write-Fail 'Node.js não encontrado. Instale o Node.js 22 LTS ou mais recente: https://nodejs.org'
        exit 1
    }
    if ($v -lt [version]'22.13.0') {
        Write-Fail "Node.js $v é antigo. O TRUCKPULSE precisa do Node.js 22.13+ (módulo node:sqlite)."
        exit 1
    }
    Write-Ok "Node.js $v"
}

# Localiza a pasta de instalação do ETS2 (processo em execução, Steam/libraryfolders.vdf ou caminhos comuns).
function Find-Ets2Path {
    $proc = Get-Process eurotrucks2 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc -and $proc.Path) {
        return (Resolve-Path (Join-Path (Split-Path $proc.Path) '..\..')).Path
    }
    $steam = $null
    foreach ($key in 'HKCU:\Software\Valve\Steam', 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam') {
        $p = Get-ItemProperty $key -ErrorAction SilentlyContinue
        if ($p.SteamPath) { $steam = $p.SteamPath; break }
        if ($p.InstallPath) { $steam = $p.InstallPath; break }
    }
    $libs = @()
    if ($steam) {
        $libs += $steam
        $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
        if (Test-Path $vdf) {
            foreach ($m in [regex]::Matches((Get-Content $vdf -Raw), '"path"\s+"([^"]+)"')) {
                $libs += $m.Groups[1].Value -replace '\\\\', '\'
            }
        }
    }
    $libs += 'C:\Program Files (x86)\Steam', 'D:\Steam', 'D:\SteamLibrary', 'E:\SteamLibrary'
    foreach ($lib in $libs | Select-Object -Unique) {
        $candidate = Join-Path $lib 'steamapps\common\Euro Truck Simulator 2'
        if (Test-Path (Join-Path $candidate 'bin\win_x64\eurotrucks2.exe')) { return $candidate }
    }
    return $null
}
