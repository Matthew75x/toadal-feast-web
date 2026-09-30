param(
  [Parameter(Mandatory=$true)] [string]$GameRepo
)
$ErrorActionPreference='Stop'
$manifestPath='docs/implementation/CANONICAL_ASSET_SOURCE_MANIFEST.json'
if(-not (Test-Path $manifestPath)){ throw "Missing $manifestPath" }
if(-not (Test-Path $GameRepo -PathType Container)){ throw "Game repo not found: $GameRepo" }
$m=Get-Content -Raw $manifestPath | ConvertFrom-Json
$fail=@()
foreach($a in $m.required){
  $p=Join-Path $GameRepo ($a.path -replace '/','\\')
  if(-not (Test-Path $p -PathType Leaf)){ $fail += "MISSING $($a.role): $p"; continue }
  $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant()
  if($h -ne $a.sha256){ $fail += "HASH $($a.role): expected $($a.sha256) got $h" }
}
foreach($rel in $m.retiredNeverUse){
  $p=Join-Path $GameRepo ($rel -replace '/','\\')
  if(Test-Path $p){ Write-Host "RETIRED PRESENT IN SOURCE (do not copy): $rel" -ForegroundColor Yellow }
}
if($fail.Count){ $fail | ForEach-Object { Write-Error $_ }; exit 1 }
Write-Host 'WO-001 ASSET AUDIT PASS'
Write-Host ("Verified assets: " + $m.required.Count)