export function buildMessages({
    brain,
    memory,
    reasoning,
    message
}) {

    const messages = [];

    // ==========================================
    // AP SYNAPSE BRAIN
    // ==========================================

    messages.push({
        role: "system",
        content: brain
    });

    // ==========================================
    // CONVERSATION MEMORY
    // ==========================================

    if (Array.isArray(memory) && memory.length > 0) {

        // The current user message is already stored
        // by server.js before buildMessages() runs.
        //
        // Remove that final duplicate and add the
        // current message exactly once below.

        const lastMemoryMessage =
            memory[memory.length - 1];

        const lastIsCurrentUser =
            lastMemoryMessage?.role === "user" &&
            typeof lastMemoryMessage?.content === "string" &&
            lastMemoryMessage.content === message;

        const previousMemory =
            lastIsCurrentUser
                ? memory.slice(0, -1)
                : memory;

        messages.push(...previousMemory);
    }

    // ==========================================
    // CURRENT ANALYSIS
    // ==========================================

    messages.push({

        role: "system",

        content: `
CURRENT ANALYSIS

Intent:
${reasoning.intent}

Response Style:
${reasoning.responseStyle || "balanced"}

Teaching Mode:
${reasoning.useTeaching || false}

Research Mode:
${reasoning.useResearch || false}

Code Formatting:
${reasoning.useCodeFormatting || false}

Instructions:

• Follow the AP Synapse Brain.
• Answer accurately.
• Match the user's level.
• Use Markdown where appropriate.
• Format code professionally.
• Never contradict your identity.
• Be concise unless more detail is requested.
`
    });

    // ==========================================
    // CURRENT USER MESSAGE — EXACTLY ONCE
    // ==========================================

    messages.push({

        role: "user",

        content: message

    });

    return messages;
}