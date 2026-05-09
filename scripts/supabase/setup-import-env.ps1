$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ExamplePath = Join-Path $RepoRoot "supabase\.env.import.example"
$EnvPath = Join-Path $RepoRoot "supabase\.env.import"
$GitignorePath = Join-Path $RepoRoot ".gitignore"

function Test-GitIgnored {
  param([string]$RelativePath)

  Push-Location $RepoRoot
  try {
    git check-ignore --quiet $RelativePath 2>$null
    if ($LASTEXITCODE -eq 0) {
      return $true
    }
  } catch {
    # Fall through to text check below.
  } finally {
    Pop-Location
  }

  if (!(Test-Path $GitignorePath)) {
    return $false
  }

  $normalized = $RelativePath -replace "\\", "/"
  $lines = Get-Content $GitignorePath | ForEach-Object { ($_ -replace "\\", "/").Trim() }
  return $lines -contains $normalized
}

Write-Host ""
Write-Host "Make Teams Pro Supabase shadow import setup" -ForegroundColor Cyan
Write-Host "This creates/opens a LOCAL env file. It does not change the app." -ForegroundColor DarkGray
Write-Host ""

if (!(Test-Path $ExamplePath)) {
  throw "Missing template: $ExamplePath"
}

if (!(Test-Path $EnvPath)) {
  Copy-Item $ExamplePath $EnvPath
  Write-Host "Created supabase\.env.import from the example template." -ForegroundColor Green
} else {
  Write-Host "supabase\.env.import already exists. Leaving it in place." -ForegroundColor Yellow
}

if (Test-GitIgnored "supabase/.env.import") {
  Write-Host "Verified: supabase\.env.import is gitignored." -ForegroundColor Green
} else {
  Write-Host "WARNING: supabase\.env.import does not appear to be gitignored." -ForegroundColor Red
  Write-Host "Do not paste secrets until .gitignore contains: supabase/.env.import" -ForegroundColor Red
}

Write-Host ""
Write-Host "Notepad will open now." -ForegroundColor Cyan
Write-Host "Paste these values into supabase\.env.import:" -ForegroundColor White
Write-Host "  SUPABASE_URL=https://your-project-ref.supabase.co" -ForegroundColor White
Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your service_role key" -ForegroundColor White
Write-Host ""
Write-Host "Keep this line as-is for the first run:" -ForegroundColor Yellow
Write-Host "  SUPABASE_IMPORT_DRY_RUN=true" -ForegroundColor Yellow
Write-Host ""
Write-Host "Optional: add Apps Script admin credentials if you want automatic export." -ForegroundColor DarkGray
Write-Host "The script will never print your service role key." -ForegroundColor DarkGray
Write-Host ""

Start-Process notepad.exe -ArgumentList "`"$EnvPath`"" -Wait

Write-Host ""
Write-Host "Setup file closed." -ForegroundColor Green
Write-Host "Next command:" -ForegroundColor Cyan
Write-Host "  npm.cmd run supabase:shadow:dry-run" -ForegroundColor White
