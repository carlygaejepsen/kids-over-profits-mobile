# Put the newest app on your phone (Expo Go). Run by the "KOP app on phone" desktop shortcut
# (scripts/make-phone-shortcut.ps1 makes it), or by hand: powershell -ExecutionPolicy Bypass -File scripts\phone.ps1
#
# 1. Gets the newest code from GitHub (skipped, with a note, if that fails).
# 2. Runs npm install only when package.json or package-lock.json changed since the last install.
# 3. Starts Expo: scan the QR code with the iPhone camera, or from inside Expo Go on Android.
#    If the phone can't connect, close Expo with Ctrl+C and press T to try again over the internet (tunnel).

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$Host.UI.RawUI.WindowTitle = 'KOP app on phone'

function Say($text, $color = 'Cyan') { Write-Host ''; Write-Host $text -ForegroundColor $color }

Say 'Getting the newest code from GitHub...'
git pull --ff-only
if ($LASTEXITCODE -ne 0) {
    Say 'Could not get the newest code (no internet, or files changed on this PC). Starting with the code already here.' 'Yellow'
}

# npm install only when the package list moved since the last time this script installed.
$stamp = Join-Path $repo 'node_modules\.kop-phone-install'
$files = @('package.json', 'package-lock.json') | Where-Object { Test-Path $_ }
$hash = ($files | ForEach-Object { (Get-FileHash $_ -Algorithm SHA256).Hash }) -join ''
$last = if (Test-Path $stamp) { Get-Content $stamp -Raw } else { '' }
if (-not (Test-Path 'node_modules') -or $hash -ne $last.Trim()) {
    Say 'The package list changed: installing (a minute or two)...'
    npm install
    if ($LASTEXITCODE -eq 0) { Set-Content -Path $stamp -Value $hash -NoNewline }
    else { Say 'npm install failed; trying to start anyway.' 'Yellow' }
} else {
    Say 'Packages are up to date.'
}

$mode = ''
while ($true) {
    if ($mode -eq '--tunnel') {
        Say 'Starting Expo over the internet (tunnel). Scan the new QR code on your phone.'
        npx expo start --tunnel
    } else {
        Say 'Starting Expo. Scan the QR code: iPhone camera, or the scanner inside Expo Go on Android.'
        Say 'Phone and PC must be on the same Wi-Fi, VPN off. Save a file and the phone reloads by itself.' 'Gray'
        npx expo start
    }
    Say 'Expo stopped. Press T to start again over the internet (if the phone could not connect), R to start again the same way, any other key to close.' 'Yellow'
    $key = [Console]::ReadKey($true).KeyChar.ToString().ToLower()
    if ($key -eq 't') { $mode = '--tunnel' }
    elseif ($key -ne 'r') { break }
}
