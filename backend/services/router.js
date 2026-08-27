import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";
import { createStream as openrouter } from "./openrouterService.js";
import { createStream as deepseek } from "./deepseekService.js";
import { generateImage as generateGeminiImage } from "./geminiImageService.js";

// ============================================================
// AP_RESILIENCE_CORE_V1
// Provider timeout + retry + circuit breaker
// ============================================================

const AP_PROVIDER_TIMEOUT_MS = 12000;
const AP_PROVIDER_RETRIES = 2;
const AP_PROVIDER_COOLDOWN_MS = 30000;

const AP_PROVIDER_HEALTH = new Map();

function apSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function apWithTimeout(promise, ms, label) {

    let timer;

    const timeout = new Promise((_, reject) => {

        timer = setTimeout(() => {

            const error = new Error(label);
            error.code = "AP_PROVIDER_TIMEOUT";

            reject(error);

        }, ms);

    });

    return Promise
        .race([
            Promise.resolve(promise),
            timeout
        ])
        .finally(() => {
            clearTimeout(timer);
        });
}

function apProviderState(name) {

    if (!AP_PROVIDER_HEALTH.has(name)) {

        AP_PROVIDER_HEALTH.set(name, {
            failures: 0,
            openUntil: 0
        });

    }

    return AP_PROVIDER_HEALTH.get(name);
}

function apIsRetryableProviderError(error) {

    const status = getErrorStatus(error);

    if (!status) {
        return true;
    }

    return [
        408,
        409,
        425,
        429,
        500,
        502,
        503,
        504
    ].includes(status);
}



function getErrorStatus(error) {

    const message =
        error?.message ||
        String(error || "");

    const match =
        message.match(/\b(400|401|402|403|404|408|409|413|429|500|502|503|504)\b/);

    return match
        ? Number(match[1])
        : null;

}


function describeProviderError(error) {

    const status =
        getErrorStatus(error);

    if (status === 401) {
        return "authentication failed";
    }

    if (status === 402) {
        return "insufficient balance / payment required";
    }

    if (status === 403) {
        return "access forbidden";
    }

    if (status === 404) {
        return "model or endpoint unavailable";
    }

    if (status === 408) {
        return "request timeout";
    }

    if (status === 413) {
        return "request too large";
    }

    if (status === 429) {
        return "rate limit reached";
    }

    if (status >= 500) {
        return `provider server error (${status})`;
    }

    return error?.message || "unknown provider error";

}



async function tryProvider(
    providerName,
    providerFunction,
    messages
) {

    const state =
        apProviderState(providerName);

    if (
        state.openUntil &&
        state.openUntil > Date.now()
    ) {

        console.warn(
            providerName +
            " temporarily bypassed by resilience circuit."
        );

        return null;
    }

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= AP_PROVIDER_RETRIES;
        attempt++
    ) {

        try {

            console.log(
                "Trying " +
                providerName +
                " — attempt " +
                attempt +
                "/" +
                AP_PROVIDER_RETRIES
            );

            const stream =
                await apWithTimeout(
                    Promise.resolve().then(
                        () =>
                            providerFunction(
                                messages
                            )
                    ),
                    AP_PROVIDER_TIMEOUT_MS,
                    providerName +
                        " connection timeout"
                );

            state.failures = 0;
            state.openUntil = 0;

            console.log(
                providerName +
                " accepted the request."
            );

            return stream;

        }
        catch (error) {

            lastError = error;

            console.error(
                providerName +
                " attempt failed:",
                describeProviderError(error)
            );

            const retryable =
                apIsRetryableProviderError(
                    error
                );

            if (
                !retryable ||
                attempt >= AP_PROVIDER_RETRIES
            ) {
                break;
            }

            await apSleep(
                400 *
                Math.pow(2, attempt - 1)
            );
        }
    }

    state.failures += 1;

    if (state.failures >= 2) {

        state.openUntil =
            Date.now() +
            AP_PROVIDER_COOLDOWN_MS;

        console.warn(
            providerName +
            " circuit opened for " +
            AP_PROVIDER_COOLDOWN_MS +
            "ms."
        );
    }

    console.error(
        providerName +
        " unavailable after resilience attempts:",
        describeProviderError(lastError)
    );

    return null;
}



// ============================================================
// AP_STREAM_FAILOVER_V2
// Mid-stream provider recovery
// ============================================================

function apChunkText(chunk) {

    return (
        chunk?.choices?.[0]
            ?.delta?.content ||
        ""
    );
}

function apSyntheticChunk(text) {

    return {
        choices: [
            {
                delta: {
                    content: text
                }
            }
        ]
    };
}

function apRemoveStreamOverlap(
    existingText,
    incomingText
) {

    const previous =
        String(existingText || "");

    const incoming =
        String(incomingText || "");

    if (!previous || !incoming) {
        return incoming;
    }

    const max =
        Math.min(
            600,
            previous.length,
            incoming.length
        );

    /*
     * Find the largest exact overlap between the end
     * of the existing answer and beginning of recovery.
     */

    for (
        let size = max;
        size >= 12;
        size--
    ) {

        const previousTail =
            previous.slice(-size);

        const incomingHead =
            incoming.slice(0, size);

        if (previousTail === incomingHead) {

            return incoming.slice(size);
        }
    }

    return incoming;
}

function apBuildContinuationMessages(
    originalMessages,
    partialReply
) {

    /*
     * Keep enough context to continue accurately without
     * sending an unlimited partial answer back to a provider.
     */

    const partial =
        String(partialReply || "")
            .slice(-12000);

    return [
        ...originalMessages,

        {
            role: "assistant",
            content: partial
        },

        {
            role: "user",
            content:
                "Continue the same assistant response exactly from where it stopped. " +
                "Do not restart the answer. Do not repeat text already written. " +
                "Continue naturally from the final words of the assistant message."
        }
    ];
}

function apRecordMidStreamFailure(
    providerName
) {

    try {

        const state =
            apProviderState(
                providerName
            );

        state.failures += 1;

        if (state.failures >= 2) {

            state.openUntil =
                Date.now() +
                AP_PROVIDER_COOLDOWN_MS;
        }

    }
    catch {}
}

async function* apFailoverStream(
    providers,
    originalMessages
) {

    let accumulated = "";
    let activeMessages =
        originalMessages;

    let lastError = null;

    for (
        let providerIndex = 0;
        providerIndex < providers.length;
        providerIndex++
    ) {

        const provider =
            providers[
                providerIndex
            ];

        const stream =
            await tryProvider(
                provider.name,
                provider.fn,
                activeMessages
            );

        if (!stream) {
            continue;
        }

        const recovering =
            accumulated.length > 0;

        /*
         * During recovery we briefly buffer the beginning
         * so duplicated overlap can be removed before it
         * reaches the browser.
         */

        let recoveryBuffer = "";

        try {

            for await (
                const chunk of stream
            ) {

                const chunkText =
                    apChunkText(chunk);

                if (!chunkText) {
                    continue;
                }

                if (
                    recovering &&
                    recoveryBuffer !== null
                ) {

                    recoveryBuffer +=
                        chunkText;

                    /*
                     * Wait for enough continuation text to
                     * make overlap comparison useful.
                     */

                    if (
                        recoveryBuffer.length <
                        240
                    ) {
                        continue;
                    }

                    const cleaned =
                        apRemoveStreamOverlap(
                            accumulated,
                            recoveryBuffer
                        );

                    recoveryBuffer = null;

                    if (cleaned) {

                        accumulated +=
                            cleaned;

                        yield apSyntheticChunk(
                            cleaned
                        );
                    }

                    continue;
                }

                accumulated +=
                    chunkText;

                yield chunk;
            }

            /*
             * Provider completed before recovery buffer
             * reached the normal flush threshold.
             */

            if (
                recovering &&
                recoveryBuffer !== null &&
                recoveryBuffer
            ) {

                const cleaned =
                    apRemoveStreamOverlap(
                        accumulated,
                        recoveryBuffer
                    );

                if (cleaned) {

                    accumulated +=
                        cleaned;

                    yield apSyntheticChunk(
                        cleaned
                    );
                }
            }

            /*
             * Entire answer completed successfully.
             */

            return;

        }
        catch (error) {

            lastError = error;

            /*
             * Do not throw away valid text that arrived just
             * before the stream itself failed.
             */

            if (
                recovering &&
                recoveryBuffer
            ) {

                const cleaned =
                    apRemoveStreamOverlap(
                        accumulated,
                        recoveryBuffer
                    );

                if (cleaned) {

                    accumulated +=
                        cleaned;

                    yield apSyntheticChunk(
                        cleaned
                    );
                }
            }

            console.error(
                provider.name +
                " stream interrupted. " +
                "AP Synapse is continuing with another provider:",
                describeProviderError(
                    error
                )
            );

            apRecordMidStreamFailure(
                provider.name
            );

            /*
             * The next provider receives the partial assistant
             * answer and is instructed to CONTINUE it rather
             * than regenerate from the beginning.
             */

            if (
                accumulated.trim()
            ) {

                activeMessages =
                    apBuildContinuationMessages(
                        originalMessages,
                        accumulated
                    );

            } else {

                activeMessages =
                    originalMessages;
            }
        }
    }

    throw (
        lastError ||
        new Error(
            "All AP Synapse recovery providers are currently unavailable."
        )
    );
}


export async function createAIStream(messages) {

    if (!Array.isArray(messages)) {

        throw new Error(
            "Messages must be an array."
        );

    }


    // ==========================================
    // DETECT IMAGE / VISION REQUEST
    // ==========================================

    const hasImage =
        messages.some(
            message =>
                Array.isArray(message?.content) &&
                message.content.some(
                    item =>
                        item?.type === "image_url" &&
                        item?.image_url?.url
                )
        );


    // ==========================================
    // VISION ROUTING
    // GEMINI -> OPENROUTER
    // AP_STREAM_FAILOVER_V2
    // ==========================================

    if (hasImage) {

        console.log(
            "Vision request detected."
        );

        return apFailoverStream(
            [
                {
                    name:
                        "Gemini Vision",
                    fn:
                        gemini
                },
                {
                    name:
                        "OpenRouter Vision",
                    fn:
                        openrouter
                }
            ],
            messages
        );
    }

    // ==========================================
    // IMAGE GENERATION DETECTION
    // ==========================================

    const lastUserMessage =
        [...messages]
            .reverse()
            .find(
                message =>
                    message?.role === "user" &&
                    typeof message?.content === "string"
            );

    const userText =
        lastUserMessage?.content?.trim() || "";

    const imageGenerationPattern =
        /\b(create|generate|make|draw|design|render|produce|visualize|paint|illustrate)\b.*\b(image|picture|photo|artwork|illustration|portrait|wallpaper|logo|poster|scene)\b/i;

    const wantsImageGeneration =
        imageGenerationPattern.test(userText);

    if (wantsImageGeneration) {

        console.log(
            "🎨 Image-generation request detected."
        );

        try {
            const imageResult =
                await generateGeminiImage(userText);

            return {
                type: "image",
                buffer: imageResult.buffer,
                mimeType: imageResult.mimeType
            };
        }

        catch (error) {
            console.error(
                "⚠️ Image generation unavailable:",
                describeProviderError(error)
            );

            throw new Error(
                "All AP Synapse image-generation providers are currently unavailable."
            );
        }

    }

    // ==========================================
    // TEXT ROUTING
    // GROQ -> GEMINI -> DEEPSEEK -> OPENROUTER
    // AP_STREAM_FAILOVER_V2
    // ==========================================

    console.log(
        "Text request detected."
    );

    return apFailoverStream(
        [
            {
                name: "Groq",
                fn: groq
            },
            {
                name: "Gemini",
                fn: gemini
            },
            {
                name: "DeepSeek",
                fn: deepseek
            },
            {
                name: "OpenRouter",
                fn: openrouter
            }
        ],
        messages
    );

}