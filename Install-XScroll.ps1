[CmdletBinding()]
param(
    [string] $InstallRoot = (Join-Path $env:LOCALAPPDATA 'XScroll'),
    [switch] $NoOpen
)

$ErrorActionPreference = 'Stop'

function Test-XScrollFolder([string] $Folder) {
    $manifestPath = Join-Path $Folder 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { return $false }
    try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        return ($manifest.name -eq 'XScroll' -and $manifest.manifest_version -eq 3)
    } catch {
        return $false
    }
}

$files = @('manifest.json', 'content.js', 'observe.js', 'background.js', 'icons', 'popup', 'LICENSE', 'THIRD_PARTY_LICENSES.txt')
$source = @((Join-Path $PSScriptRoot 'extension'), $PSScriptRoot) | Where-Object {
    $candidate = $_
    (Test-XScrollFolder $candidate) -and @($files | Where-Object {
        -not (Test-Path -LiteralPath (Join-Path $candidate $_))
    }).Count -eq 0
} | Select-Object -First 1

if (-not $source) {
    throw 'Fichiers introuvables. Extrais completement XScroll.zip avant de lancer ce script.'
}

$root = [System.IO.Path]::GetFullPath($InstallRoot)
$target = Join-Path $root 'extension'
if ([System.IO.Path]::GetFullPath($source) -ne $target) {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    $token = [guid]::NewGuid().ToString('N')
    $stage = Join-Path $root ("stage-$token")
    $backup = Join-Path $root ("backup-$token")

    if ((Test-Path -LiteralPath $target) -and -not (Test-XScrollFolder $target)) {
        throw "Un autre dossier existe deja ici : $target"
    }

    New-Item -ItemType Directory -Path $stage | Out-Null
    try {
        foreach ($file in $files) {
            Copy-Item -LiteralPath (Join-Path $source $file) -Destination $stage -Recurse
        }
        if (-not (Test-XScrollFolder $stage)) { throw 'Le manifeste copie est invalide.' }
        if (Test-Path -LiteralPath $target) { Move-Item -LiteralPath $target -Destination $backup }
        try {
            Move-Item -LiteralPath $stage -Destination $target
        } catch {
            if (Test-Path -LiteralPath $backup) { Move-Item -LiteralPath $backup -Destination $target }
            throw
        }
        if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Recurse -Force }
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
    }
}

Write-Host "Dossier XScroll : $target"
Write-Host "Dans chrome://extensions : Mode developpeur > Charger l'extension non empaquetee."
Write-Host 'Colle le chemin ci-dessus. Si XScroll est deja charge, clique sur Recharger.'

if (-not $NoOpen) {
    if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
        try { Set-Clipboard -Value $target } catch { Write-Warning 'Copie le chemin affiche ci-dessus.' }
    }
    $chrome = @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ } |
        ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' } |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if ($chrome) { Start-Process -FilePath $chrome -ArgumentList 'chrome://extensions/' }
}
