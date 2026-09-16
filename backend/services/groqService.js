import Groq from "groq-sdk";
import dotenv from "dotenv";

import {
    createProviderAdmissionError,
    prepareGroqMessages
} from "./contextGovernor.js";
import {
    reserveProviderTokens
} from "./providerTokenLedger.js";
import {
    apLog
} from "./observability.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function createStream(
    messages,
    { requestId } = {}
) {
    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    const prepared = prepareGroqMessages(messages);
    const reservedTokens =
        prepared.promptTokens +
        prepared.policy.maxCompletionTokens;

    apLog("info", "provider.context_prepared", {
        request: requestId,
        provider: "Groq",
        input_messages: messages.length,
        sent_messages: prepared.messages.length,
        dropped_messages: prepared.droppedMessages,
        prompt_tokens: prepared.promptTokens,
        prompt_limit:
            prepared.policy.maxPromptTokens,
        output_reserve:
            prepared.policy.maxCompletionTokens
    });

    const capacity = await reserveProviderTokens({
        provider: "groq",
        tokens: reservedTokens,
        tokenLimit:
            prepared.policy.tokensPerMinute -
            prepared.policy.safetyMarginTokens
    });

    if (!capacity.admitted) {
        throw createProviderAdmissionError(
            "ORGANIZATION_TPM_CAPACITY_UNAVAILABLE",
            {
                provider: "groq",
                reservation_source:
                    capacity.source,
                tokens_requested:
                    reservedTokens,
                tokens_used:
                    capacity.used,
                retryAfterMs:
                    capacity.retryAfterMs
            }
        );
    }

    apLog("info", "provider.capacity_reserved", {
        request: requestId,
        provider: "Groq",
        source: capacity.source,
        reserved_tokens: reservedTokens,
        rolling_tokens: capacity.used,
        rolling_limit:
            prepared.policy.tokensPerMinute -
            prepared.policy.safetyMarginTokens
    });

    return groq.chat.completions.create({
        model:
            process.env.GROQ_MODEL ||
            "openai/gpt-oss-120b",
        messages: prepared.messages,
        max_completion_tokens:
            prepared.policy.maxCompletionTokens,
        stream: true
    });
}
