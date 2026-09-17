param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse",
    [string]$Model = "qwen3.5:4b"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

if (!(Get-Command ollama -ErrorAction SilentlyContinue)) {
    throw "Ollama is not installed or not in PATH."
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " AP SYNAPSE — LOCAL NATIVE INTELLIGENCE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Pulling/verifying model: $Model" -ForegroundColor Yellow
ollama pull $Model

if ($LASTEXITCODE -ne 0) {
    throw "Model pull failed."
}

$env:AP_MODEL_RUNTIME = "ollama"
$env:AP_OLLAMA_URL = "http://127.0.0.1:11434"

$env:AP_FAST_MODEL = $Model
$env:AP_GENERAL_MODEL = $Model
$env:AP_REASONING_MODEL = $Model
$env:AP_CODE_MODEL = $Model
$env:AP_JUDGE_MODEL = $Model
$env:AP_SYNTHESIS_MODEL = $Model
$env:AP_VISION_MODEL = $Model

Write-Host ""
Write-Host "=== SMOKE TEST ===" -ForegroundColor Cyan
node .\backend\evaluation\APSmokeTest.js

if ($LASTEXITCODE -ne 0) {
    throw "Smoke test failed."
}

Write-Host ""
Write-Host "=== INDEPENDENCE TEST ===" -ForegroundColor Cyan
node .\backend\evaluation\APIndependenceTest.js

if ($LASTEXITCODE -ne 0) {
    throw "Independence test failed."
}

Write-Host ""
Write-Host "=== BENCHMARK ===" -ForegroundColor Cyan
node .\backend\evaluation\APBenchmark.js

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " ✅ AP UNIFIED INTELLIGENCE LOCAL CORE PASSED" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
