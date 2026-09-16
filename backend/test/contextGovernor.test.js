import assert from "node:assert/strict";
import test from "node:test";

import {
    estimatePromptTokens,
    getGroqPolicy,
    prepareGroqMessages,
    prepareMessagesForProvider
} from "../services/contextGovernor.js";
import {
    reserveProviderTokens,
    resetLocalProviderTokenLedgerForTests
} from "../services/providerTokenLedger.js";

test("small requests pass through unchanged", () => {
    const messages = [
        {
            role: "system",
            content: "You are AP Synapse."
        },
        {
            role: "user",
            content: "Hello"
        }
    ];

    const result = prepareMessagesForProvider(
        messages,
        {
            provider: "groq",
            maxPromptTokens: 1000
        }
    );

    assert.deepEqual(result.messages, messages);
    assert.equal(result.droppedMessages, 0);
    assert.ok(result.promptTokens < 1000);
});

test("oldest complete turns are removed before the current request", () => {
    const longText = "history ".repeat(250);
    const messages = [
        {
            role: "system",
            content: "Keep this instruction."
        },
        {
            role: "user",
            content: longText
        },
        {
            role: "assistant",
            content: longText
        },
        {
            role: "user",
            content: "Recent question"
        },
        {
            role: "assistant",
            content: "Recent answer"
        },
        {
            role: "user",
            content: "Current request"
        }
    ];

    const mandatoryTokens = estimatePromptTokens([
        messages[0],
        messages[5]
    ]);

    const recentTokens = estimatePromptTokens([
        messages[0],
        messages[3],
        messages[4],
        messages[5]
    ]);

    const result = prepareMessagesForProvider(
        messages,
        {
            provider: "groq",
            maxPromptTokens:
                Math.max(
                    256,
                    recentTokens + 5,
                    mandatoryTokens + 5
                )
        }
    );

    assert.deepEqual(result.messages, [
        messages[0],
        messages[3],
        messages[4],
        messages[5]
    ]);
    assert.equal(result.droppedMessages, 2);
});

test("mandatory oversized content is denied before a provider call", () => {
    const messages = [
        {
            role: "system",
            content: "instruction ".repeat(600)
        },
        {
            role: "user",
            content: "current request"
        }
    ];

    assert.throws(
        () => prepareMessagesForProvider(
            messages,
            {
                provider: "groq",
                maxPromptTokens: 256
            }
        ),
        error =>
            error?.code ===
                "AP_PROVIDER_ADMISSION_DENIED" &&
            error?.reason ===
                "MANDATORY_CONTEXT_EXCEEDS_BUDGET"
    );
});

test("Groq policy cannot exceed the organization TPM envelope", () => {
    const policy = getGroqPolicy({
        GROQ_TPM_LIMIT: "8000",
        GROQ_MAX_PROMPT_TOKENS: "999999",
        GROQ_MAX_COMPLETION_TOKENS: "1400",
        GROQ_TOKEN_SAFETY_MARGIN: "400"
    });

    assert.equal(policy.maxPromptTokens, 6200);
    assert.equal(
        policy.maxPromptTokens +
            policy.maxCompletionTokens +
            policy.safetyMarginTokens,
        policy.tokensPerMinute
    );
});

test("a 23-message chat preserves the tiny current request", () => {
    const messages = [
        {
            role: "system",
            content: "AP Synapse system context"
        },
        {
            role: "system",
            content: "AP personalization context"
        },
        ...Array.from({ length: 20 }, (_, index) => ({
            role:
                index % 2 === 0
                    ? "user"
                    : "assistant",
            content: `old-${index} ` +
                "context ".repeat(300)
        })),
        {
            role: "user",
            content: "hi"
        }
    ];

    const result = prepareGroqMessages(messages, {
        GROQ_TPM_LIMIT: "8000",
        GROQ_MAX_COMPLETION_TOKENS: "1400",
        GROQ_TOKEN_SAFETY_MARGIN: "400"
    });

    assert.equal(
        result.messages.at(-1).content,
        "hi"
    );
    assert.ok(
        result.promptTokens <=
            result.policy.maxPromptTokens
    );
    assert.ok(result.droppedMessages > 0);
});

test("local rolling ledger rejects organization-wide oversubscription", async () => {
    const previousDatabaseUrl =
        process.env.DATABASE_URL;
    const previousPostgresUrl =
        process.env.POSTGRES_URL;

    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    resetLocalProviderTokenLedgerForTests();

    try {
        const first = await reserveProviderTokens({
            provider: "groq-test",
            tokens: 5000,
            tokenLimit: 8000
        });

        const second = await reserveProviderTokens({
            provider: "groq-test",
            tokens: 4000,
            tokenLimit: 8000
        });

        assert.equal(first.admitted, true);
        assert.equal(second.admitted, false);
    }
    finally {
        if (previousDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL =
                previousDatabaseUrl;
        }

        if (previousPostgresUrl === undefined) {
            delete process.env.POSTGRES_URL;
        } else {
            process.env.POSTGRES_URL =
                previousPostgresUrl;
        }

        resetLocalProviderTokenLedgerForTests();
    }
});
