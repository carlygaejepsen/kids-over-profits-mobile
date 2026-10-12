# Makes the "KOP app on phone" shortcut on the desktop, which runs scripts\phone.ps1. Run once:
#   powershell -ExecutionPolicy Bypass -File scripts\make-phone-shortcut.ps1

$script = Join-Path $PSScriptRoot 'phone.ps1'
$desktop = [Environment]::GetFolderPath('Desktop')
$link = Join-Path $desktop 'KOP app on phone.lnk'

$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut($link)
$s.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$s.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$s.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$s.IconLocation = "$env:SystemRoot\System32\imageres.dll,41"
$s.Description = 'Get the newest Kids Over Profits app code and open it on your phone with Expo Go'
$s.Save()
Write-Host "Made $link"
