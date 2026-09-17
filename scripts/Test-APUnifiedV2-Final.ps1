param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

$branch = git branch --show-current

if ($branch -ne "ap-unified-intelligence-v1") {
    throw "STOP: expected ap-unified-intelligence-v1, found $branch"
}

Write-Host ""
Write-Host "=== FINAL V2 QUALITY FIX VALIDATION ===" -ForegroundColor Cyan

$files = @(
    ".\backend\intelligence\APQualityGate.js",
    ".\backend\intelligence\APVerifier.js",
    ".\backend\intelligence\APIntelligenceCore.js",
    ".\backend\evaluation\APBenchmarkV2.js"
)

foreach ($file in $files) {
    if (!(Test-Path $file)) {
        throw "Missing: $file"
    }

    node --check $file

    if ($LASTEXITCODE -ne 0) {
        throw "Syntax failed: $file"
    }

    Write-Host "OK: $file" -ForegroundColor Green
}

$model = "qwen3.5:0.8b"

$env:AP_MODEL_RUNTIME = "ollama"
$env:AP_OLLAMA_URL = "http://127.0.0.1:11434"

$env:AP_FAST_MODEL = $model
$env:AP_GENERAL_MODEL = $model
$env:AP_REASONING_MODEL = $model
$env:AP_CODE_MODEL = $model
$env:AP_JUDGE_MODEL = $model
$env:AP_SYNTHESIS_MODEL = $model
$env:AP_VISION_MODEL = $model

$env:AP_OLLAMA_NUM_CTX = "1536"
$env:AP_OLLAMA_NUM_PREDICT = "512"
$env:AP_MAX_TOKENS = "512"
$env:AP_NATIVE_TIMEOUT_MS = "180000"

$keys = @(
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OPENROUTER_API_KEY",
    "DEEPSEEK_API_KEY",
    "ANTHROPIC_API_KEY",
    "MISTRAL_API_KEY",
    "TOGETHER_API_KEY",
    "PERPLEXITY_API_KEY"
)

foreach ($key in $keys) {
    Remove-Item "Env:$key" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== RUNNING AP V2 QUALITY BENCHMARK ===" -ForegroundColor Cyan

node .\backend\evaluation\APBenchmarkV2.js

$code = $LASTEXITCODE

Write-Host ""
Write-Host "V2 EXIT CODE: $code" -ForegroundColor Yellow

if ($code -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " AP UNIFIED INTELLIGENCE V2 - 5/5 QUALITY PASS" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "One or more benchmark assertions still failed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Production router: UNTOUCHED"
Write-Host "Main branch: UNTOUCHED"
Write-Host "Render: UNTOUCHED"
Write-Host "Vercel: UNTOUCHED"
Write-Host "Deployment: NONE"
