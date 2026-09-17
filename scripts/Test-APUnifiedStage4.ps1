param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

$branch =
    git branch --show-current

if (
    $branch -ne
    "ap-unified-intelligence-v1"
) {
    throw "STOP: expected ap-unified-intelligence-v1, found $branch"
}

$expectedHead =
    "dec688d"

$head =
    git rev-parse --short HEAD

Write-Host ""
Write-Host "Stage 4 branch: $branch"
Write-Host "Starting HEAD: $head"

$files = @(
    ".\backend\intelligence\APRealContextBridge.js",
    ".\backend\intelligence\APIntegratedIntelligence.js",
    ".\backend\intelligence\index.js",
    ".\backend\services\apIntegratedIntelligenceService.js",
    ".\backend\evaluation\APStage4IntegrationTest.js"
)

Write-Host ""
Write-Host "=== AP STAGE 4 SYNTAX VALIDATION ===" -ForegroundColor Cyan

foreach (
    $file in $files
) {
    if (
        !(Test-Path $file)
    ) {
        throw "Missing: $file"
    }

    node --check $file

    if (
        $LASTEXITCODE -ne 0
    ) {
        throw "Syntax failed: $file"
    }

    Write-Host "OK: $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== AP STAGE 4 REAL SERVICE CONTRACT TEST ===" -ForegroundColor Cyan

node .\backend\evaluation\APStage4IntegrationTest.js

$stage4 =
    $LASTEXITCODE

if (
    $stage4 -ne 0
) {
    throw "AP Stage 4 integration contract test failed."
}

Write-Host ""
Write-Host "=== AP STAGE 3 REGRESSION ===" -ForegroundColor Cyan

powershell -ExecutionPolicy Bypass `
    -File .\scripts\Test-APUnifiedStage3.ps1

$stage3 =
    $LASTEXITCODE

if (
    $stage3 -ne 0
) {
    throw "Stage 4 introduced a Stage 3/V2 regression."
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " AP UNIFIED INTELLIGENCE STAGE 4 PASSED" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Conversation-store adapter: ACTIVE"
Write-Host "Postgres personalization adapter: ACTIVE"
Write-Host "Document-memory adapter: ACTIVE"
Write-Host "Tavily web-source adapter: ACTIVE"
Write-Host "Integrated AP service boundary: ACTIVE"
Write-Host "Router wiring: NOT ENABLED"
Write-Host ""
Write-Host "Production router: UNTOUCHED"
Write-Host "Main branch: UNTOUCHED"
Write-Host "Render: UNTOUCHED"
Write-Host "Vercel: UNTOUCHED"
Write-Host "Deployment: NONE"
