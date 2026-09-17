const env = process.env;

function model(name, fallback) {
    return String(env[name] || fallback).trim();
}

export function getModelRegistry() {
    const runtime = String(env.AP_MODEL_RUNTIME || "ollama").trim().toLowerCase();

    return {
        runtime,

        ollama: {
            baseUrl: String(env.AP_OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, ""),
        },

        openaiCompatible: {
            baseUrl: String(env.AP_NATIVE_BASE_URL || "http://127.0.0.1:8000/v1").replace(/\/+$/, ""),
            apiKey: String(env.AP_NATIVE_API_KEY || ""),
        },

        roles: {
            fast: model("AP_FAST_MODEL", "qwen3.5:4b"),
            general: model("AP_GENERAL_MODEL", "qwen3.5:4b"),
            reasoning: model("AP_REASONING_MODEL", "qwen3.5:4b"),
            code: model("AP_CODE_MODEL", "qwen3.5:4b"),
            judge: model("AP_JUDGE_MODEL", "qwen3.5:4b"),
            synthesis: model("AP_SYNTHESIS_MODEL", "qwen3.5:4b"),
            vision: model("AP_VISION_MODEL", "qwen3.5:4b"),
        },

        generation: {
            temperature: Number(env.AP_TEMPERATURE || 0.35),
            maxTokens: Number(env.AP_MAX_TOKENS || 4096),
            timeoutMs: Number(env.AP_NATIVE_TIMEOUT_MS || 120000),
        }
    };
}

export function modelForRole(role) {
    const registry = getModelRegistry();
    return registry.roles[role] || registry.roles.general;
}
