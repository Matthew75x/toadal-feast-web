param(
  [Parameter(Mandatory=$true)][string]$RepoPath,
  [string]$GameRepo = "",
  [string]$ExportPath = "",
  [string]$PagesBase = "/toadal-feast-web/",
  [string]$ChromeBin = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
)

$ErrorActionPreference = "Stop"
$RepoPath = (Resolve-Path $RepoPath).Path
$failures = New-Object System.Collections.Generic.List[string]

function Run-Step([string]$Name, [scriptblock]$Action) {
  Write-Host "== $Name =="
  try {
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
    Write-Host "PASS: $Name"
  } catch {
    $failures.Add("${Name}: $($_.Exception.Message)")
    Write-Host "FAIL: $Name"
  }
}

$env:CHROMIUM_BIN = $ChromeBin
$env:TOADAL_CDP_PORT = "9247"
Run-Step "CP9 donor integrity" { node "$PSScriptRoot\verify-cp9-donor.mjs" $RepoPath }
Run-Step "Home visual contract" { node "$PSScriptRoot\verify-home-visual-contract.mjs" $RepoPath }
Run-Step "Navigation truth" { node "$PSScriptRoot\verify-navigation-truth.mjs" $RepoPath }
Run-Step "Home structural integrity" { node "$PSScriptRoot\audit-home-integrity.mjs" $RepoPath }
Run-Step "Home asset loading" { node "$PSScriptRoot\audit-home-assets.mjs" $RepoPath }
Run-Step "Exact viewport matrix" { node "$PSScriptRoot\audit-home-viewports.mjs" $RepoPath }

if ($GameRepo) {
  $assetAudit = Join-Path $RepoPath "scripts\wo001-asset-audit.ps1"
  Run-Step "Canonical source asset audit" {
    Push-Location $RepoPath
    try { powershell -ExecutionPolicy Bypass -File $assetAudit -GameRepo $GameRepo }
    finally { Pop-Location }
  }
}

if ($ExportPath) {
  $ExportPath = (Resolve-Path $ExportPath).Path
  Run-Step "Static export links" {
    node (Join-Path $RepoPath "scripts\verify-static-links.mjs") $ExportPath $PagesBase
  }
  Run-Step "GitHub Pages base path" {
    node (Join-Path $RepoPath "scripts\verify-pages-basepath.mjs") $ExportPath $PagesBase
  }
}
if ($failures.Count) {
  Write-Host "WO-001 INDEPENDENT GATE: FAIL"
  foreach ($failure in $failures) { Write-Host "- $failure" }
  exit 1
}

Write-Host "WO-001 INDEPENDENT GATE: PASS"
Write-Host "Repo: $RepoPath"
if ($ExportPath) { Write-Host "Export: $ExportPath" }
exit 0