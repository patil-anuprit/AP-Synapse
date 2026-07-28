export function buildMessages({

    brain,
    memory,
    reasoning,
    message

}) {

    const messages = [];

    // AP Synapse Brain
    messages.push({

        role: "system",

        content: brain

    });

    // Conversation Memory
    if (memory && memory.length > 0) {

        messages.push(...memory);

    }

    // Internal Analysis
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

    // User Message
    messages.push({

        role: "user",

        content: message

    });

    return messages;

}