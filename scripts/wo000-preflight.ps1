param(
  [Parameter(Mandatory=$true)]
  [string]$StudioZip
)

$ErrorActionPreference = 'Stop'
$ExpectedHash = 'bad679307d6fa4ab8a75ac6dd3700cd8988cf92874ba2a7a287ee7b2ba9c5ec8'
$ExpectedBranch = 'work/WO-000-environment-baseline'

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

if (-not (Test-Path $StudioZip -PathType Leaf)) { Fail "Studio archive not found: $StudioZip" }
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $StudioZip).Hash.ToLowerInvariant()
if ($actualHash -ne $ExpectedHash) { Fail "Studio SHA-256 mismatch. Expected $ExpectedHash, got $actualHash" }

$branch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -ne $ExpectedBranch) { Fail "Wrong Git branch. Expected $ExpectedBranch, got '$branch'" }
if (-not (Test-Path 'docs/work-orders/WO-000-environment-baseline.md')) { Fail 'WO-000 work order is missing from this checkout.' }

$nodeRaw = (node --version).Trim()
if ($LASTEXITCODE -ne 0) { Fail 'Node.js is unavailable.' }
$major = [int](($nodeRaw -replace '^v','').Split('.')[0])
if ($major -lt 22) { Fail "Node.js 22+ required. Found $nodeRaw" }
$npmRaw = (npm --version).Trim()
if ($LASTEXITCODE -ne 0) { Fail 'npm is unavailable.' }

Write-Host 'WO-000 PRECHECK PASS'
Write-Host "Branch: $branch"
Write-Host "Node: $nodeRaw"
Write-Host "npm: $npmRaw"
Write-Host "Studio ZIP: $StudioZip"
Write-Host "Studio SHA-256: $actualHash"