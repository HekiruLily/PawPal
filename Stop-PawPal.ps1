[CmdletBinding(SupportsShouldProcess)]
param()
$path = Join-Path $PSScriptRoot '.pawpal-runtime/processes.json'
if (!(Test-Path $path)) { Write-Host 'No recorded PawPal processes.'; return }
foreach ($record in @(Get-Content -Raw $path | ConvertFrom-Json)) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $record.started) {
        if ($PSCmdlet.ShouldProcess("$($process.ProcessName) PID $($process.Id)", 'Stop PawPal process')) { Stop-Process -Id $process.Id }
    }
}
Write-Host 'MySQL data is retained. Stop MySQL separately with: cd backend; docker compose stop mysql'
