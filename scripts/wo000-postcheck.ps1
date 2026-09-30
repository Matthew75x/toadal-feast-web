param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectManifest
)

$ErrorActionPreference = 'Stop'
function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

if (-not (Test-Path $ProjectManifest -PathType Leaf)) { Fail "Fresh Studio project manifest missing: $ProjectManifest" }
$resolved = (Resolve-Path $ProjectManifest).Path
$expectedRoot = (Resolve-Path 'studio-project').Path
if (-not $resolved.StartsWith($expectedRoot, [System.StringComparison]::OrdinalIgnoreCase)) { Fail "Project manifest is not under repository studio-project/: $resolved" }

$project = Get-Content -Raw -LiteralPath $resolved | ConvertFrom-Json
if ($project.projectKind -ne 'generic-site') { Fail "Expected projectKind generic-site, got '$($project.projectKind)'" }

if (-not (Test-Path 'docs/environment/DGENERATOR_BASELINE.md' -PathType Leaf)) { Fail 'docs/environment/DGENERATOR_BASELINE.md is missing.' }

$trackedGenerated = git ls-files 'studio-project/**/build/**' 'studio-project/**/.studio-history/**' 'studio-project/**/.studio-recovery/**'
if ($trackedGenerated) { Fail ('Generated Studio state is tracked unexpectedly: ' + ($trackedGenerated -join ', ')) }

$distDiff = git diff --name-only main...HEAD -- dist/
if ($distDiff) { Fail ('WO-000 must not change tracked dist/. Found: ' + ($distDiff -join ', ')) }

Write-Host 'WO-000 POSTCHECK PASS'
Write-Host "Project: $resolved"
Write-Host "Project ID: $($project.id)"
Write-Host "Project kind: $($project.projectKind)"