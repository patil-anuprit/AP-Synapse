param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse",
    [string]$Branch = "ap-unified-intelligence-v1",
    [switch]$SkipBranch
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " AP SYNAPSE — UNIFIED INTELLIGENCE PREP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (!(Test-Path $ProjectRoot)) {
    throw "Project root not found: $ProjectRoot"
}

Set-Location $ProjectRoot

if (!(Test-Path ".git")) {
    throw "This is not a Git repository."
}

if (!(Test-Path ".\backend")) {
    throw "backend folder not found."
}

if (!$SkipBranch) {
    $dirty = git status --porcelain

    if ($dirty) {
        throw @"
Working tree has uncommitted changes.
Nothing was modified.
Commit or stash the current work, then run this script again.
"@
    }

    $existing = git branch --list $Branch

    if ($existing) {
        git switch $Branch
    }
    else {
        git switch -c $Branch
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Could not create/switch development branch."
    }
}

Write-Host ""
Write-Host "Node:" -ForegroundColor Yellow
node --version

Write-Host ""
Write-Host "Checking AP intelligence files..." -ForegroundColor Yellow

$required = @(
    ".\backend\intelligence\APIntelligenceCore.js",
    ".\backend\intelligence\APCouncil.js",
    ".\backend\intelligence\APVerifier.js",
    ".\backend\intelligence\APSynthesizer.js",
    ".\backend\models\APModelClient.js",
    ".\backend\evaluation\APIndependenceTest.js"
)

foreach ($file in $required) {
    if (!(Test-Path $file)) {
        throw "Missing: $file"
    }
    node --check $file
    if ($LASTEXITCODE -ne 0) {
        throw "JavaScript validation failed: $file"
    }
    Write-Host "✅ $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ollama:" -ForegroundColor Yellow

$ollama = Get-Command ollama -ErrorAction SilentlyContinue

if ($ollama) {
    ollama --version
    Write-Host "✅ Ollama installed" -ForegroundColor Green
}
else {
    Write-Host "⚠ Ollama is not installed yet." -ForegroundColor Yellow
    Write-Host "Install Ollama for Windows before running the local model."
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " AP UNIFIED INTELLIGENCE DEVELOPMENT TREE READY" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
