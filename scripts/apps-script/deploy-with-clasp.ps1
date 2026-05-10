$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message"
}

function Get-ProjectRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

function Load-LocalDeployEnv {
  param([string]$ProjectRoot)

  $envFile = Join-Path $ProjectRoot ".apps-script-deploy.env"
  if (!(Test-Path -LiteralPath $envFile)) {
    return
  }

  Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#")) {
      return
    }
    $match = [regex]::Match($line, '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$')
    if (!$match.Success) {
      return
    }
    $key = $match.Groups[1].Value
    $value = $match.Groups[2].Value.Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key, "Process"))) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

function Resolve-ClaspCommand {
  $cmd = Get-Command "clasp.cmd" -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }
  $cmd = Get-Command "clasp" -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }
  throw "clasp is not installed or is not on PATH. Install with: npm.cmd install -g @google/clasp"
}

function Invoke-Clasp {
  param(
    [string]$ClaspCommand,
    [string[]]$CommandArgs,
    [string]$FailureMessage
  )

  Write-Host "clasp $($CommandArgs -join ' ')"
  $output = & $ClaspCommand @CommandArgs 2>&1
  $exitCode = $LASTEXITCODE
  if ($output) {
    $output | ForEach-Object { Write-Host $_ }
  }
  if ($exitCode -ne 0) {
    throw "$FailureMessage (exit code $exitCode)"
  }
  return @($output)
}

$projectRoot = Get-ProjectRoot
Set-Location $projectRoot
Load-LocalDeployEnv -ProjectRoot $projectRoot

$claspJson = Join-Path $projectRoot ".clasp.json"
if (!(Test-Path -LiteralPath $claspJson)) {
  throw ".clasp.json is missing. Copy .clasp.json.example to .clasp.json and set the existing Apps Script scriptId."
}

$deploymentId = [Environment]::GetEnvironmentVariable("APPS_SCRIPT_DEPLOYMENT_ID", "Process")
if ([string]::IsNullOrWhiteSpace($deploymentId)) {
  throw "APPS_SCRIPT_DEPLOYMENT_ID is missing. Set it in your shell or in .apps-script-deploy.env."
}

$clasp = Resolve-ClaspCommand
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = [Environment]::GetEnvironmentVariable("APPS_SCRIPT_DEPLOY_MESSAGE", "Process")
if ([string]::IsNullOrWhiteSpace($message)) {
  $message = "Make Teams Pro deploy $timestamp"
}

Write-Step "Checking clasp login/project"
Invoke-Clasp -ClaspCommand $clasp -CommandArgs @("status") -FailureMessage "clasp status failed. Run npm.cmd run apps-script:login first." | Out-Null

Write-Step "Pushing local Apps Script files"
Invoke-Clasp -ClaspCommand $clasp -CommandArgs @("push") -FailureMessage "clasp push failed" | Out-Null

Write-Step "Creating immutable Apps Script version"
$versionOutput = Invoke-Clasp -ClaspCommand $clasp -CommandArgs @("version", $message) -FailureMessage "clasp version failed"
$versionText = ($versionOutput -join "`n")
$versionMatch = [regex]::Match($versionText, '(?i)(?:created\s+version|version)\s+(\d+)')
if (!$versionMatch.Success) {
  throw "Could not parse created Apps Script version from clasp output."
}
$versionNumber = $versionMatch.Groups[1].Value
Write-Host "Created Apps Script version: $versionNumber"

Write-Step "Redeploying existing Web App deployment"
Invoke-Clasp -ClaspCommand $clasp -CommandArgs @(
  "deploy",
  "--deploymentId",
  $deploymentId,
  "--versionNumber",
  $versionNumber,
  "--description",
  $message
) -FailureMessage "clasp deploy --deploymentId failed" | Out-Null

Write-Host ""
Write-Host "Apps Script deploy complete."
Write-Host "Deployment ID: $deploymentId"
Write-Host "Version: $versionNumber"
Write-Host "Existing web app URL/API URL is unchanged."
