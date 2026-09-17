# AP Synapse — Unified Intelligence Core V1

This package builds a provider-independent AP Synapse intelligence layer **without changing production or deploying anything**.

## Architecture

User request
→ AP Intent Engine
→ AP Router
→ AP Council (fast/general/reasoning/code/vision)
→ AP Verifier
→ AP Synthesizer
→ AP Confidence Engine
→ final AP Synapse answer

The model runtime is swappable:

- **Local development:** Ollama
- **Cloud GPU later:** vLLM / another AP-controlled OpenAI-compatible inference server

The code does not require Groq, Gemini, OpenRouter, DeepSeek, OpenAI, or Anthropic for its own inference path.

## Important

This package intentionally does **not** patch the current AP Synapse production router automatically.

Build and test the independent core first. Integrate it locally only after it passes.

## Step 1 — copy package into the AP Synapse repository

Extract this ZIP so its `backend` and `scripts` folders merge into:

`D:\Projects\AP-Synapse`

No existing files are overwritten except if files with the same new AP Unified filenames already exist.

## Step 2 — create the isolated development branch

From PowerShell:

```powershell
cd D:\Projects\AP-Synapse
powershell -ExecutionPolicy Bypass -File .\scripts\Prepare-APUnifiedIntelligence.ps1
```

If Git has uncommitted changes the script stops safely.

## Step 3 — install Ollama

Install Ollama for Windows.

Then use the local runner:

```powershell
cd D:\Projects\AP-Synapse
powershell -ExecutionPolicy Bypass -File .\scripts\Run-APUnifiedLocal.ps1
```

The default is `qwen3.5:4b`, chosen for easier local bring-up on a 16 GB machine.

After that works, try:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Run-APUnifiedLocal.ps1 -Model "qwen3.5:9b"
```

## Step 4 — required local proof

The package runs:

1. smoke test
2. provider-independence test
3. multi-domain benchmark

The independence test does not call any commercial model provider.

## Step 5 — local integration only

Only after all tests pass:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Connect-APUnifiedToRouter-LATER.ps1
```

This adds AP Unified as the first **local** text engine while keeping current providers as temporary fallbacks.

Still do **not** deploy.

## Step 6 — final independence gate

Before production deployment:

- all commercial inference keys disabled in the test environment
- AP Unified answers general questions
- AP Unified solves maths/reasoning
- AP Unified writes/debugs code
- memory works
- documents work
- Aprisha works
- tools work
- vision works with the selected self-hosted multimodal model
- stress tests pass
- rollback path verified

## Step 7 — cloud GPU later

Switch environment variables:

```text
AP_MODEL_RUNTIME=vllm
AP_NATIVE_BASE_URL=https://YOUR-PRIVATE-AP-GPU/v1
AP_NATIVE_API_KEY=...
AP_GENERAL_MODEL=Qwen/Qwen3.5-9B
...
```

The AP intelligence architecture itself does not need to change.

## What this package does NOT claim

It does not claim that AP Synapse invented the underlying open-weight foundation model.

It establishes an AP-controlled compound intelligence architecture that can run without a commercial inference API, with AP-owned routing, council, verification, synthesis, confidence logic, memory/tool integration points, and deployment control.
