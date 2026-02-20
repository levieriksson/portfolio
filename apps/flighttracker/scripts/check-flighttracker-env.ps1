# apps/flighttracker/scripts/check-flighttracker-env.ps1
$ErrorActionPreference = "Stop"

function Get-Var($name, $target) {
  return [Environment]::GetEnvironmentVariable($name, $target)
}

function Check-Var($name, [bool]$sensitive=$false) {
  $proc    = Get-Var $name "Process"
  $user    = Get-Var $name "User"
  $machine = Get-Var $name "Machine"

  $foundTarget = $null
  $value = $null

  if (-not [string]::IsNullOrEmpty($proc))    { $foundTarget = "Process"; $value = $proc }
  elseif (-not [string]::IsNullOrEmpty($user))    { $foundTarget = "User"; $value = $user }
  elseif (-not [string]::IsNullOrEmpty($machine)) { $foundTarget = "Machine"; $value = $machine }

  if ($null -eq $foundTarget) {
    Write-Host ("[MISSING] {0}" -f $name)
    return $false
  }

  if ($sensitive) {
    Write-Host ("[SET]     {0} (scope: {1})" -f $name, $foundTarget)
  } else {
    Write-Host ("[SET]     {0} (scope: {1}) = {2}" -f $name, $foundTarget, $value)
  }
  return $true
}

Write-Host "=== Flighttracker env check ==="
$ok = $true

# OpenSky
if (-not (Check-Var "OPENSKY_USERNAME" $false)) { $ok = $false }
if (-not (Check-Var "OPENSKY_PASSWORD" $true))  { $ok = $false }

# DB + provider
if (-not (Check-Var "Database__Provider" $false)) { $ok = $false }
if (-not (Check-Var "ConnectionStrings__FlightDb" $true)) { $ok = $false }

# API bind (optional; can be set per run)
Check-Var "ASPNETCORE_URLS" $false | Out-Null

Write-Host ""
Write-Host "=== Suggested commands to set missing vars (CURRENT PowerShell SESSION only) ==="
Write-Host '$env:Database__Provider = "postgres"'
Write-Host '$env:ConnectionStrings__FlightDb = "Host=localhost;Port=5432;Database=flighttracker;Username=postgres;Password=postgres;Include Error Detail=true"'
Write-Host '$env:ASPNETCORE_URLS = "http://localhost:5000"'
Write-Host ""
Write-Host "=== Suggested commands to set vars persistently (User scope) ==="
Write-Host '[Environment]::SetEnvironmentVariable("Database__Provider","postgres","User")'
Write-Host '[Environment]::SetEnvironmentVariable("ConnectionStrings__FlightDb","<your-conn-string>","User")'
Write-Host '[Environment]::SetEnvironmentVariable("ASPNETCORE_URLS","http://localhost:5000","User")'
Write-Host ""
Write-Host "Note: If you set persistent vars, restart your terminal so they load."

if ($ok) {
  Write-Host "`nAll required vars appear to be set (some may only be in User/Machine scope)."
} else {
  Write-Host "`nSome required vars are missing. Use the commands above to set them."
}
