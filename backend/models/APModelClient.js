import { getModelRegistry, modelForRole } from "./APModelRegistry.js";
import { ollamaComplete } from "./APOllamaProvider.js";
import { openAICompatibleComplete } from "./APOpenAICompatibleProvider.js";

export async function completeWithRole(role, messages, overrides = {}) {
    const registry = getModelRegistry();
    const model = overrides.model || modelForRole(role);

    const common = {
        model,
        messages,
        temperature: overrides.temperature ?? registry.generation.temperature,
        maxTokens: overrides.maxTokens ?? registry.generation.maxTokens,
        timeoutMs: overrides.timeoutMs ?? registry.generation.timeoutMs,
    };

    if (registry.runtime === "ollama") {
        return ollamaComplete({
            ...common,
            baseUrl: registry.ollama.baseUrl,
        });
    }

    if (["vllm", "openai-compatible", "native"].includes(registry.runtime)) {
        return openAICompatibleComplete({
            ...common,
            baseUrl: registry.openaiCompatible.baseUrl,
            apiKey: registry.openaiCompatible.apiKey,
        });
    }

    throw new Error(`Unsupported AP_MODEL_RUNTIME: ${registry.runtime}`);
}
