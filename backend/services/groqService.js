import Groq from "groq-sdk";
import dotenv from "dotenv";

import {
    createProviderAdmissionError,
    prepareGroqMessages
} from "./contextGovernor.js";
import {
    reserveProviderTokens
} from "./providerTokenLedger.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function createStream(messages) {
    if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array.");
    }

    const prepared = prepareGroqMessages(messages);
    const reservedTokens =
        prepared.promptTokens +
        prepared.policy.maxCompletionTokens;

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
                retryAfterMs:
                    capacity.retryAfterMs
            }
        );
    }

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
