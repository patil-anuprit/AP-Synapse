function flattenContent(content) {
    if (typeof content === "string") return content;

    if (!Array.isArray(content)) return String(content || "");

    return content
        .filter(part => part?.type === "text" && typeof part?.text === "string")
        .map(part => part.text)
        .join("\n");
}

function normalizeMessages(messages = []) {
    return messages.map(message => ({
        role: message?.role || "user",
        content: flattenContent(message?.content),
    }));
}

export async function ollamaComplete({
    baseUrl,
    model,
    messages,
    temperature = 0.35,
    maxTokens = 1024,
    timeoutMs = 120000,
}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages: normalizeMessages(messages),
                stream: false,

                // AP_LOCAL_DIRECT_ANSWER_V1
                // Prevent thinking tokens from consuming
                // the small laptop inference budget.
                think: false,

                options: {
                    temperature,

                    num_ctx:
                        Number(
                            process.env.AP_OLLAMA_NUM_CTX ||
                            2048
                        ),

                    num_predict:
                        Math.min(
                            Number(maxTokens || 1024),
                            Number(
                                process.env.AP_OLLAMA_NUM_PREDICT ||
                                768
                            )
                        )
                }
            })
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`AP Ollama ${response.status}: ${text.slice(0, 800)}`);
        }

        const data = await response.json();
        const content = data?.message?.content;

        if (!content) {
            throw new Error("AP Ollama returned an empty response.");
        }

        return String(content).trim();
    } finally {
        clearTimeout(timer);
    }
}

export async function ollamaHealth(baseUrl) {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
        throw new Error(`Ollama health check failed (${response.status}).`);
    }
    return response.json();
}
