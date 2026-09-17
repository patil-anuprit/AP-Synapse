export function lastUserText(messages = []) {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message?.role !== "user") continue;

        if (typeof message.content === "string") {
            return message.content.trim();
        }

        if (Array.isArray(message.content)) {
            return message.content
                .filter(part => part?.type === "text" && typeof part?.text === "string")
                .map(part => part.text)
                .join("\n")
                .trim();
        }
    }
    return "";
}

export function hasImageInput(messages = []) {
    return messages.some(message =>
        Array.isArray(message?.content) &&
        message.content.some(part =>
            ["image_url", "image"].includes(part?.type)
        )
    );
}

export function safeJsonParse(text, fallback = null) {
    const raw = String(text || "").trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");

    try {
        return JSON.parse(raw);
    } catch {
        const first = raw.indexOf("{");
        const last = raw.lastIndexOf("}");
        if (first >= 0 && last > first) {
            try {
                return JSON.parse(raw.slice(first, last + 1));
            } catch {}
        }
    }
    return fallback;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
}

export function unique(items) {
    return [...new Set(items.filter(Boolean))];
}

export function syntheticChunk(text) {
    return {
        choices: [{
            delta: {
                content: String(text || "")
            }
        }]
    };
}

export async function* textToOpenAIStream(text, chunkSize = 80) {
    const value = String(text || "");
    for (let i = 0; i < value.length; i += chunkSize) {
        yield syntheticChunk(value.slice(i, i + chunkSize));
        await Promise.resolve();
    }
}
