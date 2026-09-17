param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

$branch = git branch --show-current

if (
    $branch -ne
    "ap-unified-intelligence-v1"
) {
    throw "STOP: expected ap-unified-intelligence-v1, found $branch"
}

$required = @(
    ".\backend\intelligence\APPlanner.js",
    ".\backend\intelligence\APQualityGate.js",
    ".\backend\intelligence\APDeterministicChecks.js",
    ".\backend\intelligence\APCouncil.js",
    ".\backend\intelligence\APVerifier.js",
    ".\backend\intelligence\APIntelligenceCore.js",
    ".\backend\evaluation\APBenchmarkV2.js"
)

Write-Host ""
Write-Host "=== AP UNIFIED V2 FILE CHECK ===" -ForegroundColor Cyan

foreach (
    $file in $required
) {
    if (
        !(Test-Path $file)
    ) {
        throw "Missing: $file"
    }

    Write-Host "✅ $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== AP UNIFIED V2 SYNTAX CHECK ===" -ForegroundColor Cyan

foreach (
    $file in $required
) {
    node --check $file

    if (
        $LASTEXITCODE -ne 0
    ) {
        throw "Syntax failed: $file"
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " ✅ AP UNIFIED INTELLIGENCE V2 READY" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Production router: UNTOUCHED"
Write-Host "Render: UNTOUCHED"
Write-Host "Vercel: UNTOUCHED"
Write-Host "Nothing deployed"
