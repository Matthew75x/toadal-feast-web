[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Get-Location).Path,
    [string]$DownloadsRoot = (Join-Path $env:USERPROFILE 'Downloads')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath($RepositoryRoot)
$shaProvider = [Security.Cryptography.SHA256]::Create()

$packages = @(
    @{ File = 'TOADAL_WEBSITE_CODEX_HANDOFF_LEAN_2026-09-29.zip'; Sha256 = 'A428AA2400E2DE7DEEDD037A5EE36758F6D41FA9539F7995CF7974D6F19E468D'; Entries = @(
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/00_START_HERE/README_START_HERE.md'; Destination = 'docs/authority/sources/product/README_START_HERE.md' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/01_PRODUCT_SPEC/LOCKED_PRODUCT_DECISIONS.md'; Destination = 'docs/authority/sources/product/LOCKED_PRODUCT_DECISIONS.md' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/01_PRODUCT_SPEC/SITEMAP_30_PAGES.md'; Destination = 'docs/authority/sources/product/SITEMAP_30_PAGES.md' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/01_PRODUCT_SPEC/VISUAL_SYSTEM_AND_CONTENT_RULES.md'; Destination = 'docs/authority/sources/product/VISUAL_SYSTEM_AND_CONTENT_RULES.md' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/01_PRODUCT_SPEC/FEATURE_SALVAGE_RULES.md'; Destination = 'docs/authority/sources/product/FEATURE_SALVAGE_RULES.md' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/02_PLAY_GAMES_HUB.png'; Destination = 'assets/reference/mockups/batch-1/02_PLAY_GAMES_HUB.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/03_WICKED_BITES_DETAIL.png'; Destination = 'assets/reference/mockups/batch-1/03_WICKED_BITES_DETAIL.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/04_BROWSER_GAME_PLAYER.png'; Destination = 'assets/reference/mockups/batch-1/04_BROWSER_GAME_PLAYER.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/05_WORLD_HUB.png'; Destination = 'assets/reference/mockups/batch-1/05_WORLD_HUB.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/06_CHARACTERS_HUB.png'; Destination = 'assets/reference/mockups/batch-1/06_CHARACTERS_HUB.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/07_TOADAL_PROFILE.png'; Destination = 'assets/reference/mockups/batch-1/07_TOADAL_PROFILE.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/08_STORIES_COMICS_HUB.png'; Destination = 'assets/reference/mockups/batch-1/08_STORIES_COMICS_HUB.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/09_MANGA_SERIES.png'; Destination = 'assets/reference/mockups/batch-1/09_MANGA_SERIES.png' },
        @{ Entry = 'TOADAL_WEBSITE_CODEX_HANDOFF/03_VISUAL_AUTHORITY/BATCH_1_APPROVED_DIRECTION/10_COMIC_READER.png'; Destination = 'assets/reference/mockups/batch-1/10_COMIC_READER.png' }
    ) },
    @{ File = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS.zip'; Sha256 = 'D5BA818C9328D31327CE557AF68A5B40729E65A54AD649BD5E61A5BC48D3AF8F'; Entries = @(
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/README.md'; Destination = 'docs/authority/sources/mockups/README.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/PAGE_MANIFEST.md'; Destination = 'docs/authority/sources/mockups/PAGE_MANIFEST.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/DESIGN_SYSTEM.md'; Destination = 'docs/authority/sources/mockups/DESIGN_SYSTEM.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/MOTION_NOTES.md'; Destination = 'docs/authority/sources/mockups/MOTION_NOTES.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/TOADAL_REACTION_STATE_MAP.md'; Destination = 'docs/authority/sources/mockups/TOADAL_REACTION_STATE_MAP.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/ASSET_MAP.md'; Destination = 'docs/authority/sources/mockups/ASSET_MAP.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/QA_REPORT.md'; Destination = 'docs/authority/sources/mockups/QA_REPORT.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/IMPLEMENTATION_NOTES.md'; Destination = 'docs/authority/sources/mockups/IMPLEMENTATION_NOTES.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/FEATURE_SALVAGE_LEDGER.md'; Destination = 'docs/authority/sources/mockups/FEATURE_SALVAGE_LEDGER.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/MOBILE_PLAN.md'; Destination = 'docs/authority/sources/mockups/MOBILE_PLAN.md' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/OUTPUT_MANIFEST_SHA256.json'; Destination = 'docs/authority/sources/mockups/OUTPUT_MANIFEST_SHA256.json' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/contact-sheet/DESKTOP_30_PAGE_CONTACT_SHEET.jpg'; Destination = 'assets/reference/mockups/mixed-concepts/DESKTOP_30_PAGE_CONTACT_SHEET.jpg' },
        @{ Entry = 'TOADAL_WEBSITE_DEFINITIVE_MOCKUPS/contact-sheet/MOBILE_10_FLOW_CONTACT_SHEET.jpg'; Destination = 'assets/reference/mockups/mixed-concepts/MOBILE_10_FLOW_CONTACT_SHEET.jpg' }
    ) },
    @{ File = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1.zip'; Sha256 = '0361A993C9EC2F905ADBA1B9DF66A1C16E7A3A66AD26232351914201CE38681A'; Entries = @(
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/00_DOCS/TOADAL_WEBSITE_INTERACTIVE_MASCOT_MASTER_PLAN.md'; Destination = 'docs/authority/sources/companion/TOADAL_WEBSITE_INTERACTIVE_MASCOT_MASTER_PLAN.md' },
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/00_DOCS/TOADAL_INTERACTION_ASSET_MAP.json'; Destination = 'docs/authority/sources/companion/TOADAL_INTERACTION_ASSET_MAP.json' },
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/00_DOCS/INTERACTION_STATE_MAP.csv'; Destination = 'docs/authority/sources/companion/INTERACTION_STATE_MAP.csv' },
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/00_DOCS/EXPRESSION_AUDIT.csv'; Destination = 'docs/authority/sources/companion/EXPRESSION_AUDIT.csv' },
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/00_DOCS/ASSET_REGISTRY.csv'; Destination = 'docs/authority/sources/companion/ASSET_REGISTRY.csv' },
        @{ Entry = 'TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1/02_CORE_PACK/TOADAL_10_INDIVIDUAL_WEB_ASSETS/manifest.json'; Destination = 'docs/authority/sources/companion/TOADAL_10_INDIVIDUAL_WEB_ASSETS_manifest.json' }
    ) },
    @{ File = 'TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip'; Sha256 = '06275F4803C8C63E141C34DBCF252BB9C9AB0C35EDAE460C7C940FD2F687A76A'; Entries = @(
        @{ Entry = '01_PRODUCTION_READY_FULL_SIZE/16_Adventure_Discovery/TOADAL_ADVENTURE_MAP_GUIDE_POINTING_v03.png'; Destination = 'studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-adventure-map-guide.png' },
        @{ Entry = '01_PRODUCTION_READY_FULL_SIZE/01_Support_Help/TOADAL_SUPPORT_HEADSET_TABLET_v03.png'; Destination = 'studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-support-headset.png' },
        @{ Entry = '01_PRODUCTION_READY_FULL_SIZE/06_Mobile_Apps/TOADAL_MOBILE_APPS_SMARTPHONE_v01.png'; Destination = 'studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-mobile-app.png' },
        @{ Entry = '01_PRODUCTION_READY_FULL_SIZE/17_Wellbeing_Time_Sleep/TOADAL_THINKING_SEATED_ROCK_NATURE_v01.png'; Destination = 'studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-thinking-seated.png' }
    ) }
)

$records = @()
foreach ($package in $packages) {
    $archivePath = Join-Path $DownloadsRoot $package.File
    if (-not (Test-Path -LiteralPath $archivePath)) { throw "Missing source package: $archivePath" }
    $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
    if ($archiveHash -ne $package.Sha256) { throw "Source ZIP hash mismatch: $($package.File)" }
    $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        foreach ($item in $package.Entries) {
            if ($item.Entry.Contains('..') -or [IO.Path]::IsPathRooted($item.Entry)) { throw "Unsafe ZIP path: $($item.Entry)" }
            $entry = $zip.GetEntry($item.Entry)
            if (-not $entry -or $entry.FullName.EndsWith('/')) { throw "Missing file entry $($item.Entry) in $($package.File)" }
            $destination = [IO.Path]::GetFullPath((Join-Path $root $item.Destination))
            if (-not $destination.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe destination: $destination" }
            $sourceStream = $entry.Open()
            try { $entryHash = [BitConverter]::ToString($shaProvider.ComputeHash($sourceStream)).Replace('-', '').ToUpperInvariant() } finally { $sourceStream.Dispose() }
            if (Test-Path -LiteralPath $destination) {
                $existingHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
                if ($existingHash -ne $entryHash) { throw "Destination contains different bytes: $destination" }
            } else {
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
                [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $false)
            }
            $records += [PSCustomObject]@{ archive = $package.File; archiveSha256 = $archiveHash; entry = $entry.FullName; path = $item.Destination; bytes = $entry.Length; sha256 = $entryHash }
        }
    } finally { $zip.Dispose() }
}
$standaloneSources = @(
    @{ File = 'toadal-games-interactive-site-plan.md'; Sha256 = '3EB738FE0EF1932F2D7A50FD52C8C09BBB9DE5C9CF81B5294DE6AB6FAC676DD1'; Destination = 'docs/authority/sources/history/toadal-games-interactive-site-plan.md' },
    @{ File = 'toadal-games-interactive-site-plan_v2.md'; Sha256 = '03EA0F29CEFD92A2DA178EE320E067CE1C2749DCD94CB5E8BC64552D22E4C18C'; Destination = 'docs/authority/sources/history/toadal-games-interactive-site-plan_v2.md' },
    @{ File = 'toadal-games-interactive-site-plan(1).md'; Sha256 = 'E9979579C14CDE4A8237C0FE6E44554C4B4B31ADCA4487DCFC407059E60A5F22'; Destination = 'docs/authority/sources/history/toadal-games-interactive-site-plan-alternate.md' }
)
foreach ($item in $standaloneSources) {
    $sourcePath = Join-Path $DownloadsRoot $item.File
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing standalone source: $sourcePath" }
    $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
    if ($sourceHash -ne $item.Sha256) { throw "Standalone source hash mismatch: $($item.File)" }
    $destination = [IO.Path]::GetFullPath((Join-Path $root $item.Destination))
    if (-not $destination.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe destination: $destination" }
    if (Test-Path -LiteralPath $destination) {
        if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $sourceHash) { throw "Destination contains different bytes: $destination" }
    } else {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
        Copy-Item -LiteralPath $sourcePath -Destination $destination
    }
    $records += [PSCustomObject]@{ archive = $item.File; archiveSha256 = $sourceHash; entry = $item.File; path = $item.Destination; bytes = (Get-Item -LiteralPath $destination).Length; sha256 = $sourceHash }
}
$records | Sort-Object path | Format-Table -AutoSize
Write-Output "Verified and preserved $($records.Count) source entries. No original archive was copied to the repository."
