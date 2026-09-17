export async function openAICompatibleComplete({
    baseUrl,
    apiKey,
    model,
    messages,
    temperature = 0.35,
    maxTokens = 4096,
    timeoutMs = 120000,
}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
        "Content-Type": "application/json",
    };

    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers,
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                temperature,
                max_tokens: maxTokens,
            })
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`AP native server ${response.status}: ${text.slice(0, 1000)}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("AP native server returned an empty completion.");
        }

        return String(content).trim();
    } finally {
        clearTimeout(timer);
    }
}
