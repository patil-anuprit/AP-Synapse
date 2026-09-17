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

Write-Host ""
Write-Host "=== AP STAGE 5 SYNTAX CHECK ===" -ForegroundColor Cyan

$syntaxFiles = @(
    ".\backend\services\router.js",
    ".\backend\server.js",
    ".\backend\evaluation\APStage5RouterContractTest.js",
    ".\backend\evaluation\APStage5LocalRouteTest.js"
)

foreach (
    $file in $syntaxFiles
) {
    node --check $file

    if (
        $LASTEXITCODE -ne 0
    ) {
        throw "Syntax failed: $file"
    }

    Write-Host "OK: $file" -ForegroundColor Green
}


Write-Host ""
Write-Host "=== AP STAGE 5 ROUTER CONTRACT TEST ===" -ForegroundColor Cyan

# AP_STAGE5_CONTRACT_IMPORT_KEYS_V1
#
# Legacy provider modules validate keys during module import.
# These non-functional placeholders allow the STATIC router
# contract test to import router.js. No provider inference is
# performed by this contract test.

$env:GROQ_API_KEY =
    "gsk_stage5_contract_import_only"

$env:GEMINI_API_KEY =
    "stage5_contract_import_only"

$env:GOOGLE_API_KEY =
    "stage5_contract_import_only"

$env:OPENROUTER_API_KEY =
    "stage5_contract_import_only"

$env:DEEPSEEK_API_KEY =
    "stage5_contract_import_only"

node .\backend\evaluation\APStage5RouterContractTest.js

if (
    $LASTEXITCODE -ne 0
) {
    throw "Stage 5 router contract test failed."
}


Write-Host ""
Write-Host "=== AP STAGE 5 LOCAL AP-ONLY ROUTE TEST ===" -ForegroundColor Cyan

$model =
    "qwen3.5:0.8b"

$env:AP_UNIFIED_INTELLIGENCE_ENABLED =
    "true"

$env:AP_UNIFIED_INTELLIGENCE_SURFACES =
    "chat"

$env:AP_UNIFIED_INTELLIGENCE_TIMEOUT_MS =
    "180000"

$env:AP_MODEL_RUNTIME =
    "ollama"

$env:AP_OLLAMA_URL =
    "http://127.0.0.1:11434"

$env:AP_FAST_MODEL =
    $model

$env:AP_GENERAL_MODEL =
    $model

$env:AP_REASONING_MODEL =
    $model

$env:AP_CODE_MODEL =
    $model

$env:AP_JUDGE_MODEL =
    $model

$env:AP_SYNTHESIS_MODEL =
    $model

$env:AP_VISION_MODEL =
    $model

$env:AP_OLLAMA_NUM_CTX =
    "1536"

$env:AP_OLLAMA_NUM_PREDICT =
    "512"

$env:AP_MAX_TOKENS =
    "512"

$env:AP_NATIVE_TIMEOUT_MS =
    "180000"

$commercialKeys = @(
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

foreach (
    $key in $commercialKeys
) {
    Remove-Item `
        "Env:$key" `
        -ErrorAction SilentlyContinue
}

node .\backend\evaluation\APStage5LocalRouteTest.js

if (
    $LASTEXITCODE -ne 0
) {
    throw "Stage 5 AP-only local router test failed."
}


Write-Host ""
Write-Host "=== STAGE 4 REGRESSION ===" -ForegroundColor Cyan

node .\backend\evaluation\APStage4IntegrationTest.js

if (
    $LASTEXITCODE -ne 0
) {
    throw "Stage 4 regression detected."
}


Write-Host ""
Write-Host "=== STAGE 3 + V2 REGRESSION ===" -ForegroundColor Cyan

powershell -ExecutionPolicy Bypass `
    -File .\scripts\Test-APUnifiedStage3.ps1

if (
    $LASTEXITCODE -ne 0
) {
    throw "Stage 3/V2 regression detected."
}


Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " AP UNIFIED INTELLIGENCE STAGE 5 PASSED" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

Write-Host ""
Write-Host "Feature flag OFF behavior: LEGACY ROUTER"
Write-Host "Feature flag ON chat primary: AP UNIFIED"
Write-Host "AP failure fallback: EXISTING PROVIDER CHAIN PRESERVED"
Write-Host "Vision route: EXISTING"
Write-Host "Image generation route: EXISTING"
Write-Host "Aprisha Android: EXISTING ROUTER"
Write-Host "Aprisha Desktop: EXISTING ROUTER"
Write-Host "Deployment: NONE"
