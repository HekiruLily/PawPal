param(
    [string]$FirebaseCredentialsFile = $env:GOOGLE_APPLICATION_CREDENTIALS,
    [switch]$Android,
    [switch]$SkipInstall,
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'PawPal-develop'
$runtime = Join-Path $root '.pawpal-runtime'
function Run([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed ($LASTEXITCODE)." }
}
function Setting([string]$Name, [string]$Value) {
    $path = Join-Path $backend '.env'
    $lines = @(Get-Content -LiteralPath $path)
    if ($lines -match "^$Name=") { $lines = $lines -replace "^$Name=.*", "$Name=$Value" }
    else { $lines += "$Name=$Value" }
    [IO.File]::WriteAllLines($path, [string[]]$lines, [Text.UTF8Encoding]::new($false))
}
foreach ($command in @('node', 'npm.cmd', 'java', 'docker')) { $null = Get-Command $command -ErrorAction Stop }
$nodeVersion = [version]((& node -p 'process.versions.node').Trim())
if ($nodeVersion -lt [version]'22.11.0') { throw 'Install Node.js 22.11 or later.' }
Run 'docker' @('info', '--format', '{{.ServerVersion}}')
$envFile = Join-Path $backend '.env'
if (!$FirebaseCredentialsFile -and (Test-Path $envFile)) {
    $entry = Get-Content $envFile | Where-Object { $_ -match '^PAWPAL_FIREBASE_CREDENTIALS_FILE=' } | Select-Object -First 1
    if ($entry) { $FirebaseCredentialsFile = ($entry -split '=', 2)[1] }
}
if (!$FirebaseCredentialsFile -or !(Test-Path -LiteralPath $FirebaseCredentialsFile -PathType Leaf)) {
    throw 'Supply -FirebaseCredentialsFile with a server service-account JSON path outside this repository.'
}
$key = Get-Content -Raw -LiteralPath $FirebaseCredentialsFile | ConvertFrom-Json
if ($key.type -ne 'service_account' -or $key.project_id -ne 'pawpal-e40a5') { throw 'Expected service account for pawpal-e40a5.' }
$key = $null
$maven = if (Get-Command mvn.cmd -ErrorAction SilentlyContinue) { 'mvn.cmd' } else { Join-Path $backend 'mvnw.cmd' }
if ($CheckOnly) { Write-Host 'Prerequisites and Firebase credential file checked. No services started.'; return }
foreach ($port in @(8080, 8081)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is occupied. Stop the existing service first." }
}
New-Item -ItemType Directory -Force $runtime | Out-Null
if (!(Test-Path $envFile)) {
    $containers = & docker ps -a --filter 'name=^pawpal-local-mysql-1$' --format '{{.Names}}'
    if ($containers) { throw 'Existing PawPal MySQL found. Restore its backend/.env rather than generating different passwords.' }
    Copy-Item (Join-Path $backend '.env.example') $envFile
    Setting 'MYSQL_PASSWORD' ([guid]::NewGuid().ToString('N'))
    Setting 'MYSQL_ROOT_PASSWORD' ([guid]::NewGuid().ToString('N'))
}
Setting 'PAWPAL_FIREBASE_ENABLED' 'true'
Setting 'PAWPAL_FIREBASE_CREDENTIALS_FILE' ((Resolve-Path -LiteralPath $FirebaseCredentialsFile).Path.Replace('\', '/'))
$scope = Get-Content $envFile | Where-Object { $_ -match '^PAWPAL_FIREBASE_BOOKING_SCOPE=' }
if (!$scope -or $scope -match '=(local-change-me)?$') { Setting 'PAWPAL_FIREBASE_BOOKING_SCOPE' ([guid]::NewGuid().ToString('N')) }
Push-Location $frontend
try { if (!$SkipInstall) { Run 'npm.cmd' @('ci') } } finally { Pop-Location }
Push-Location $backend
try {
    Run 'docker' @('compose', 'up', '-d', '--wait', 'mysql')
    $env:JAVA_TOOL_OPTIONS = "$env:JAVA_TOOL_OPTIONS -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
    Run $maven @('-DskipTests', 'package')
} finally { Pop-Location }
$jar = Get-ChildItem (Join-Path $backend 'target/*.jar') | Where-Object { $_.Name -notmatch 'original' } | Select-Object -First 1
if (!$jar) { throw 'Backend JAR was not created.' }
Copy-Item $jar.FullName (Join-Path $runtime 'backend.jar') -Force
$records = @()
try {
    $server = Start-Process java -WorkingDirectory $backend -ArgumentList @('-Xmx512m', '-jar', '../.pawpal-runtime/backend.jar', '--spring.profiles.active=docker', '--server.address=127.0.0.1') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'backend.log') -RedirectStandardError (Join-Path $runtime 'backend-error.log')
    $records += @{ pid = $server.Id; started = $server.StartTime.ToUniversalTime().ToString('o') }
    $metro = Start-Process node -WorkingDirectory $frontend -ArgumentList @('node_modules/react-native/cli.js', 'start', '--host', '127.0.0.1', '--max-workers', '1') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'metro.log') -RedirectStandardError (Join-Path $runtime 'metro-error.log')
    $records += @{ pid = $metro.Id; started = $metro.StartTime.ToUniversalTime().ToString('o') }
} finally { $records | ConvertTo-Json -Depth 3 | Set-Content (Join-Path $runtime 'processes.json') }
Write-Host "Started backend and Metro. Logs: $runtime. Use Stop-PawPal.ps1 to stop them."
if ($Android) {
    $sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
    $adb = Join-Path $sdkRoot 'platform-tools/adb.exe'
    Run $adb @('reverse', 'tcp:8080', 'tcp:8080')
    Run $adb @('reverse', 'tcp:8081', 'tcp:8081')
    Push-Location $frontend
    try { Run 'npm.cmd' @('run', 'android', '--', '--no-packager') } finally { Pop-Location }
}
