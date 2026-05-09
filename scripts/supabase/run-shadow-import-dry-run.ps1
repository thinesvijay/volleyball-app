$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$EnvPath = Join-Path $RepoRoot "supabase\.env.import"

function Read-EnvFile {
  param([string]$Path)

  $values = @{}
  if (!(Test-Path $Path)) {
    return $values
  }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (!$trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed -split "=", 2
    if ($parts.Count -ne 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }

  return $values
}

function Require-Value {
  param(
    [hashtable]$Values,
    [string]$Key,
    [string]$FriendlyName
  )

  $value = ""
  if ($Values.ContainsKey($Key)) {
    $value = [string]$Values[$Key]
  }

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$FriendlyName is missing in supabase\.env.import. Run npm.cmd run supabase:setup:import-env first."
  }

  if ($value -like "https://your-project-ref.supabase.co") {
    throw "$FriendlyName still has the template value. Paste the make-teams-pro-dev value first."
  }
}

function Run-Step {
  param([string[]]$Args)

  Write-Host ""
  Write-Host "> npm.cmd $($Args -join ' ')" -ForegroundColor Cyan
  & npm.cmd @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: npm.cmd $($Args -join ' ')"
  }
}

Write-Host ""
Write-Host "Make Teams Pro Supabase shadow import dry-run" -ForegroundColor Cyan
Write-Host "Safe mode: this forces SUPABASE_IMPORT_DRY_RUN=true for this run." -ForegroundColor DarkGray
Write-Host ""

if (!(Test-Path $EnvPath)) {
  throw "Missing supabase\.env.import. Run npm.cmd run supabase:setup:import-env first."
}

$envValues = Read-EnvFile $EnvPath
Require-Value $envValues "SUPABASE_URL" "SUPABASE_URL"
Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_SERVICE_ROLE_KEY"

if ($envValues.ContainsKey("SUPABASE_IMPORT_DRY_RUN") -and $envValues["SUPABASE_IMPORT_DRY_RUN"].ToLowerInvariant() -eq "false") {
  Write-Host "supabase\.env.import says SUPABASE_IMPORT_DRY_RUN=false, but this dry-run wrapper will override it to true." -ForegroundColor Yellow
}

$previousDryRun = $env:SUPABASE_IMPORT_DRY_RUN
$env:SUPABASE_IMPORT_DRY_RUN = "true"

Push-Location $RepoRoot
try {
  Run-Step @("run", "supabase:export:player-hub")
  Run-Step @("run", "supabase:import:player-hub")
  Run-Step @("run", "supabase:validate:player-hub")
} finally {
  if ($null -eq $previousDryRun) {
    Remove-Item Env:\SUPABASE_IMPORT_DRY_RUN -ErrorAction SilentlyContinue
  } else {
    $env:SUPABASE_IMPORT_DRY_RUN = $previousDryRun
  }
  Pop-Location
}

Write-Host ""
Write-Host "Dry-run complete. No Supabase rows were changed by the import step." -ForegroundColor Green
Write-Host "Review the output above and the export file at supabase\.tmp\player-hub-export.json." -ForegroundColor White
Write-Host ""
Write-Host "Only when ready for a real dev import:" -ForegroundColor Cyan
Write-Host "  npm.cmd run supabase:shadow:real-import" -ForegroundColor White
