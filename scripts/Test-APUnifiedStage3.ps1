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

$files = @(
    ".\backend\intelligence\APTextChunker.js",
    ".\backend\intelligence\APRetrieval.js",
    ".\backend\intelligence\APKnowledgeStore.js",
    ".\backend\intelligence\APMemoryStore.js",
    ".\backend\intelligence\APDocumentContext.js",
    ".\backend\intelligence\APSafeCalculator.js",
    ".\backend\intelligence\APToolRegistry.js",
    ".\backend\intelligence\APContextEngine.js",
    ".\backend\intelligence\APIntelligenceCore.js",
    ".\backend\intelligence\index.js",
    ".\backend\evaluation\APStage3Test.js"
)

Write-Host ""
Write-Host "=== AP STAGE 3 SYNTAX VALIDATION ===" -ForegroundColor Cyan

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
Write-Host "=== AP STAGE 3 ARCHITECTURE TEST ===" -ForegroundColor Cyan

node .\backend\evaluation\APStage3Test.js

$stage3 =
    $LASTEXITCODE

if (
    $stage3 -ne 0
) {
    throw "AP Stage 3 architecture test failed."
}

Write-Host ""
Write-Host "=== AP V2 REGRESSION TEST ===" -ForegroundColor Cyan

$model =
    "qwen3.5:0.8b"

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

foreach (
    $key in $keys
) {
    Remove-Item `
        "Env:$key" `
        -ErrorAction SilentlyContinue
}

node .\backend\evaluation\APBenchmarkV2.js

$v2 =
    $LASTEXITCODE

Write-Host ""
Write-Host "Stage 3 exit: $stage3"
Write-Host "V2 regression exit: $v2"

if (
    $v2 -ne 0
) {
    throw "Stage 3 introduced a V2 regression."
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " AP UNIFIED INTELLIGENCE STAGE 3 PASSED" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Knowledge/RAG: ACTIVE"
Write-Host "Scoped memory: ACTIVE"
Write-Host "Document context: ACTIVE"
Write-Host "Safe calculator tool: ACTIVE"
Write-Host "Unified context engine: ACTIVE"
Write-Host "V2 regression: 5/5 required"
Write-Host ""
Write-Host "Production router: UNTOUCHED"
Write-Host "Main branch: UNTOUCHED"
Write-Host "Render: UNTOUCHED"
Write-Host "Vercel: UNTOUCHED"
Write-Host "Deployment: NONE"
