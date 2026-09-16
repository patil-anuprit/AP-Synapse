import { get_encoding } from "tiktoken";

const encoder = get_encoding("o200k_base");

const MESSAGE_ENVELOPE_TOKENS = 20;
const PROMPT_ENVELOPE_TOKENS = 32;
const MINIMUM_PROMPT_BUDGET = 256;

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ""), 10);

    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : fallback;
}

function tokenText(value) {
    if (typeof value === "string") {
        return value;
    }

    if (value === null || value === undefined) {
        return "";
    }

    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}

function countEncoded(value) {
    const text = tokenText(value);

    return text
        ? encoder.encode(text).length
        : 0;
}

function messageTokenCount(message) {
    if (!message || typeof message !== "object") {
        throw new TypeError("Every message must be an object.");
    }

    const {
        role = "",
        content = "",
        name = "",
        ...additionalFields
    } = message;

    let count = MESSAGE_ENVELOPE_TOKENS;

    count += countEncoded(role);
    count += countEncoded(content);
    count += countEncoded(name);

    if (Object.keys(additionalFields).length > 0) {
        count += countEncoded(additionalFields);
    }

    return count;
}

export function estimatePromptTokens(messages) {
    if (!Array.isArray(messages)) {
        throw new TypeError("Messages must be an array.");
    }

    return messages.reduce(
        (total, message) =>
            total + messageTokenCount(message),
        PROMPT_ENVELOPE_TOKENS
    );
}

export function getGroqPolicy(env = process.env) {
    const tokensPerMinute = positiveInteger(
        env.GROQ_TPM_LIMIT,
        8000
    );

    const maxCompletionTokens = positiveInteger(
        env.GROQ_MAX_COMPLETION_TOKENS,
        1400
    );

    const safetyMarginTokens = positiveInteger(
        env.GROQ_TOKEN_SAFETY_MARGIN,
        400
    );

    const hardPromptCeiling = Math.max(
        0,
        tokensPerMinute -
            maxCompletionTokens -
            safetyMarginTokens
    );

    const configuredPromptLimit = positiveInteger(
        env.GROQ_MAX_PROMPT_TOKENS,
        hardPromptCeiling
    );

    const maxPromptTokens = Math.min(
        configuredPromptLimit,
        hardPromptCeiling
    );

    if (maxPromptTokens < MINIMUM_PROMPT_BUDGET) {
        throw new Error(
            "Invalid Groq token policy: prompt budget is too small."
        );
    }

    return {
        tokensPerMinute,
        maxPromptTokens,
        maxCompletionTokens,
        safetyMarginTokens
    };
}

export function createProviderAdmissionError(
    reason,
    details = {}
) {
    const error = new Error(
        "Provider request was rejected by AP Synapse admission control."
    );

    error.name = "APProviderAdmissionError";
    error.code = "AP_PROVIDER_ADMISSION_DENIED";
    error.reason = reason;
    error.details = details;

    return error;
}

function isInstruction(message) {
    return (
        message?.role === "system" ||
        message?.role === "developer"
    );
}

function findLastUserIndex(messages) {
    for (let index = messages.length - 1; index >= 0; index--) {
        if (messages[index]?.role === "user") {
            return index;
        }
    }

    return -1;
}

function recentConversationBlocks(
    messages,
    beforeIndex,
    instructionIndices
) {
    const blocks = [];
    let index = beforeIndex - 1;

    while (index >= 0) {
        const block = [];

        while (index >= 0) {
            if (instructionIndices.has(index)) {
                index -= 1;
                continue;
            }

            block.unshift(index);

            const beginsTurn =
                messages[index]?.role === "user";

            index -= 1;

            if (beginsTurn) {
                break;
            }
        }

        if (block.length > 0) {
            blocks.push(block);
        }
    }

    return blocks;
}

function messagesAtIndices(messages, indices) {
    return [...indices]
        .sort((left, right) => left - right)
        .map(index => messages[index]);
}

export function prepareMessagesForProvider(
    messages,
    {
        provider = "unknown",
        maxPromptTokens
    }
) {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new TypeError(
            "Messages must be a non-empty array."
        );
    }

    if (
        !Number.isInteger(maxPromptTokens) ||
        maxPromptTokens < MINIMUM_PROMPT_BUDGET
    ) {
        throw new TypeError(
            "maxPromptTokens must be a valid token budget."
        );
    }

    const instructionIndices = new Set();

    messages.forEach((message, index) => {
        if (isInstruction(message)) {
            instructionIndices.add(index);
        }
    });

    const lastUserIndex = findLastUserIndex(messages);
    const activeTurnStart =
        lastUserIndex >= 0
            ? lastUserIndex
            : messages.length - 1;

    const selectedIndices = new Set(instructionIndices);

    // Preserve the current user request and any tool/assistant messages
    // that belong to the same active turn.
    for (
        let index = activeTurnStart;
        index < messages.length;
        index++
    ) {
        selectedIndices.add(index);
    }

    let prepared = messagesAtIndices(
        messages,
        selectedIndices
    );

    let promptTokens = estimatePromptTokens(prepared);

    if (promptTokens > maxPromptTokens) {
        throw createProviderAdmissionError(
            "MANDATORY_CONTEXT_EXCEEDS_BUDGET",
            {
                provider,
                promptTokens,
                maxPromptTokens
            }
        );
    }

    const blocks = recentConversationBlocks(
        messages,
        activeTurnStart,
        instructionIndices
    );

    for (const block of blocks) {
        const candidateIndices = new Set([
            ...selectedIndices,
            ...block
        ]);

        const candidate = messagesAtIndices(
            messages,
            candidateIndices
        );

        const candidateTokens =
            estimatePromptTokens(candidate);

        if (candidateTokens > maxPromptTokens) {
            // Keep a contiguous recent-history suffix. Once the next
            // newest complete turn cannot fit, older turns are omitted.
            break;
        }

        block.forEach(index =>
            selectedIndices.add(index)
        );

        prepared = candidate;
        promptTokens = candidateTokens;
    }

    return {
        messages: prepared,
        promptTokens,
        maxPromptTokens,
        droppedMessages:
            messages.length - prepared.length
    };
}

export function prepareGroqMessages(
    messages,
    env = process.env
) {
    const policy = getGroqPolicy(env);

    return {
        ...prepareMessagesForProvider(messages, {
            provider: "groq",
            maxPromptTokens:
                policy.maxPromptTokens
        }),
        policy
    };
}
