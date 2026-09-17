param(
    [string]$ProjectRoot = "D:\Projects\AP-Synapse"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

$router = ".\backend\services\router.js"

if (!(Test-Path $router)) {
    throw "router.js not found."
}

Write-Host ""
Write-Host "THIS SCRIPT IS FOR THE FINAL LOCAL INTEGRATION STAGE." -ForegroundColor Yellow
Write-Host "It does NOT deploy anything." -ForegroundColor Yellow
Write-Host ""

$text = Get-Content $router -Raw

$import = 'import { createStream as apUnified } from "./apUnifiedIntelligenceService.js";'

if (!$text.Contains($import)) {
    $anchor = 'import { createStream as deepseek } from "./deepseekService.js";'

    if (!$text.Contains($anchor)) {
        throw "Expected router import anchor not found. Stop and inspect current router."
    }

    $text = $text.Replace(
        $anchor,
        $anchor + "`r`n" + $import
    )
}

if (!$text.Contains('name: "AP Unified"')) {
    $anchor = @'
        [
            {
                name: "Groq",
                fn: groq
            },
'@

    $replacement = @'
        [
            {
                name: "AP Unified",
                fn: apUnified
            },
            {
                name: "Groq",
                fn: groq
            },
'@

    if (!$text.Contains($anchor)) {
        throw "Expected text failover list not found. Stop and inspect current router."
    }

    $text = $text.Replace($anchor, $replacement)
}

Set-Content $router $text -Encoding UTF8

node --check $router
if ($LASTEXITCODE -ne 0) {
    throw "router.js validation failed."
}

git diff --check -- $router

Write-Host ""
Write-Host "✅ AP Unified added as FIRST LOCAL text engine." -ForegroundColor Green
Write-Host "No deployment performed." -ForegroundColor Green
