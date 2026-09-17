import { createStream as groq } from "./groqService.js";
import { createStream as gemini } from "./geminiService.js";
import { createStream as openrouter } from "./openrouterService.js";
import { createStream as deepseek } from "./deepseekService.js";
import { createStream as apIntegrated } from "./apIntegratedIntelligenceService.js";
import { generateImage as generateGeminiImage } from "./geminiImageService.js";
import {
    apErrorFields,
    apLog,
    createAPRequestId
} from "./observability.js";

// ============================================================
// AP_UNIFIED_ROUTER_STAGE5
// Feature-flagged AP Integrated Intelligence.
// Default scope is chat only. Existing vision/image/Aprisha
// routes remain on their established behavior unless a caller
// explicitly opts into an allowed surface.
// ============================================================

function apEnvEnabled(value) {
    return /^(?:1|true|yes|on)$/i.test(
        String(value || "").trim()
    );
}

export function apUnifiedRouterEnabled(
    requestContext = {}
) {
    if (
        !apEnvEnabled(
            process.env
                .AP_UNIFIED_INTELLIGENCE_ENABLED
        )
    ) {
        return false;
    }

    const surface =
        String(
            requestContext?.surface ||
            ""
        )
            .trim()
            .toLowerCase();

    if (!surface) {
        return false;
    }

    const surfaces =
        String(
            process.env
                .AP_UNIFIED_INTELLIGENCE_SURFACES ||
            "chat"
        )
            .split(",")
            .map(
                item =>
                    item
                        .trim()
                        .toLowerCase()
            )
            .filter(Boolean);

    return (
        surfaces.includes("*") ||
        surfaces.includes(surface)
    );
}

function apUnifiedRouterTimeoutMs() {
    const requested =
        Number(
            process.env
                .AP_UNIFIED_INTELLIGENCE_TIMEOUT_MS ||
            120000
        );

    if (
        !Number.isFinite(requested)
    ) {
        return 120000;
    }

    return Math.min(
        300000,
        Math.max(
            5000,
            Math.floor(requested)
        )
    );
}


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

    if (apIsProviderAdmissionError(error)) {
        return false;
    }

    const status = getErrorStatus(error);

    if (!status) {
        return true;
    }

    return [
        408,
        409,
        425,
        500,
        502,
        503,
        504
    ].includes(status);
}


function apIsProviderAdmissionError(error) {

    return (
        error?.code ===
            "AP_PROVIDER_ADMISSION_DENIED" ||
        error?.name ===
            "APProviderAdmissionError"
    );
}


function apHeader(error, name) {

    const headers =
        error?.headers ||
        error?.response?.headers;

    if (!headers) {
        return null;
    }

    if (typeof headers.get === "function") {
        return headers.get(name);
    }

    return (
        headers[name] ||
        headers[name.toLowerCase()] ||
        null
    );
}


function apRetryAfterMs(error) {

    const value =
        apHeader(error, "retry-after");

    if (!value) {
        return AP_PROVIDER_COOLDOWN_MS;
    }

    const seconds = Number(value);

    if (Number.isFinite(seconds)) {
        return Math.max(
            1000,
            Math.ceil(seconds * 1000)
        );
    }

    const date = Date.parse(value);

    return Number.isFinite(date)
        ? Math.max(1000, date - Date.now())
        : AP_PROVIDER_COOLDOWN_MS;
}



function getErrorStatus(error) {

    const directStatus = Number(
        error?.status ||
        error?.response?.status
    );

    if (Number.isFinite(directStatus)) {
        return directStatus;
    }

    const message =
        error?.message ||
        String(error || "");

    const match =
        message.match(/\b(400|401|402|403|404|408|409|413|429|500|502|503|504)\b/);

    return match
        ? Number(match[1])
        : null;

}


async function tryProvider(
    providerName,
    providerFunction,
    messages,
    requestId
) {

    const state =
        apProviderState(providerName);

    if (
        state.openUntil &&
        state.openUntil > Date.now()
    ) {

        apLog("warn", "provider.skipped", {
            request: requestId,
            provider: providerName,
            reason: "circuit_open",
            retry_after_ms: Math.max(
                0,
                state.openUntil - Date.now()
            )
        });

        return null;
    }

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= AP_PROVIDER_RETRIES;
        attempt++
    ) {

        const attemptStarted =
            performance.now();

        apLog("info", "provider.attempt", {
            request: requestId,
            provider: providerName,
            attempt,
            max_attempts: AP_PROVIDER_RETRIES,
            messages: messages.length
        });

        try {

            const stream =
                await apWithTimeout(
                    Promise.resolve().then(
                        () =>
                            providerFunction(
                                messages,
                                {
                                    requestId,
                                    attempt,
                                    providerName
                                }
                            )
                    ),
                    AP_PROVIDER_TIMEOUT_MS,
                    providerName +
                        " connection timeout"
                );

            state.failures = 0;
            state.openUntil = 0;

            apLog("info", "provider.accepted", {
                request: requestId,
                provider: providerName,
                attempt,
                latency_ms: Math.round(
                    performance.now() -
                    attemptStarted
                )
            });

            return stream;

        }
        catch (error) {

            lastError = error;

            if (
                apIsProviderAdmissionError(
                    error
                )
            ) {
                const details =
                    error?.details || {};

                apLog("info", "provider.skipped", {
                    request: requestId,
                    provider: providerName,
                    reason:
                        error?.reason ||
                        "admission_denied",
                    prompt_tokens:
                        details.promptTokens,
                    prompt_limit:
                        details.maxPromptTokens,
                    tokens_requested:
                        details.tokens_requested,
                    tokens_used:
                        details.tokens_used,
                    reservation_source:
                        details.reservation_source,
                    retry_after_ms:
                        details.retryAfterMs
                });

                return null;
            }

            const status =
                getErrorStatus(error);

            if (status === 413) {
                apLog(
                    "error",
                    "provider.admission_invariant_failed",
                    {
                        request: requestId,
                        provider: providerName,
                        attempt,
                        ...apErrorFields(error)
                    }
                );

                return null;
            }

            if (status === 429) {
                // Respect the provider's cooldown and immediately route the
                // user to another provider instead of retrying too early.
                const retryAfterMs =
                    apRetryAfterMs(error);

                state.openUntil =
                    Date.now() + retryAfterMs;

                apLog("warn", "provider.rate_limited", {
                    request: requestId,
                    provider: providerName,
                    attempt,
                    retry_after_ms: retryAfterMs,
                    ...apErrorFields(error)
                });

                return null;
            }

            const retryable =
                apIsRetryableProviderError(
                    error
                );

            const willRetry =
                retryable &&
                attempt < AP_PROVIDER_RETRIES;

            apLog(
                willRetry ? "warn" : "error",
                "provider.failed",
                {
                    request: requestId,
                    provider: providerName,
                    attempt,
                    latency_ms: Math.round(
                        performance.now() -
                        attemptStarted
                    ),
                    retryable,
                    will_retry: willRetry,
                    ...apErrorFields(error)
                }
            );

            if (
                !retryable ||
                attempt >= AP_PROVIDER_RETRIES
            ) {
                break;
            }

            const backoffMs =
                400 *
                Math.pow(2, attempt - 1);

            apLog("info", "provider.retry_scheduled", {
                request: requestId,
                provider: providerName,
                next_attempt: attempt + 1,
                backoff_ms: backoffMs
            });

            await apSleep(backoffMs);
        }
    }

    state.failures += 1;

    if (state.failures >= 2) {

        state.openUntil =
            Date.now() +
            AP_PROVIDER_COOLDOWN_MS;

        apLog("warn", "provider.circuit_opened", {
            request: requestId,
            provider: providerName,
            failures: state.failures,
            cooldown_ms:
                AP_PROVIDER_COOLDOWN_MS
        });
    }

    apLog("error", "provider.unavailable", {
        request: requestId,
        provider: providerName,
        attempts: AP_PROVIDER_RETRIES,
        ...apErrorFields(lastError)
    });

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
    originalMessages,
    requestId
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
                activeMessages,
                requestId
            );

        if (!stream) {
            continue;
        }

        const recovering =
            accumulated.length > 0;

        const streamStarted =
            performance.now();

        let providerCharacters = 0;

        if (recovering) {
            apLog("warn", "stream.recovery_started", {
                request: requestId,
                provider: provider.name,
                existing_characters:
                    accumulated.length
            });
        }

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

                providerCharacters +=
                    chunkText.length;

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

            apLog("info", "provider.completed", {
                request: requestId,
                provider: provider.name,
                stream_ms: Math.round(
                    performance.now() -
                    streamStarted
                ),
                output_characters:
                    providerCharacters,
                recovered: recovering
            });

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

            apLog("error", "provider.stream_interrupted", {
                request: requestId,
                provider: provider.name,
                stream_ms: Math.round(
                    performance.now() -
                    streamStarted
                ),
                output_characters:
                    providerCharacters,
                will_failover: true,
                ...apErrorFields(error)
            });

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

    apLog("error", "route.exhausted", {
        request: requestId,
        providers:
            providers
                .map(provider => provider.name)
                .join(">"),
        ...apErrorFields(lastError)
    });

    throw (
        lastError ||
        new Error(
            "All AP Synapse recovery providers are currently unavailable."
        )
    );
}


export async function createAIStream(messages, requestContext = {}) {

    if (!Array.isArray(messages)) {

        throw new Error(
            "Messages must be an array."
        );

    }

    const requestId =
        createAPRequestId();


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

        apLog("info", "route.started", {
            request: requestId,
            mode: "vision",
            messages: messages.length,
            providers:
                "Gemini Vision>OpenRouter Vision"
        });

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
            messages,
            requestId
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

        const imageStarted =
            performance.now();

        apLog("info", "route.started", {
            request: requestId,
            mode: "image_generation",
            messages: messages.length,
            providers: "Gemini Image"
        });

        try {
            const imageResult =
                await generateGeminiImage(userText);

            apLog("info", "provider.completed", {
                request: requestId,
                provider: "Gemini Image",
                latency_ms: Math.round(
                    performance.now() -
                    imageStarted
                ),
                output_type: imageResult.mimeType
            });

            return {
                type: "image",
                buffer: imageResult.buffer,
                mimeType: imageResult.mimeType
            };
        }

        catch (error) {
            apLog("error", "provider.failed", {
                request: requestId,
                provider: "Gemini Image",
                latency_ms: Math.round(
                    performance.now() -
                    imageStarted
                ),
                retryable: false,
                will_retry: false,
                ...apErrorFields(error)
            });

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

    apLog("info", "route.started", {
        request: requestId,
        mode: "text",
        messages: messages.length,
        providers:
            "Groq>Gemini>DeepSeek>OpenRouter"
    });


    // ============================================================
    // AP_UNIFIED_ROUTER_STAGE5_TEXT_PRIMARY
    // Only normal text callers that explicitly opt into an
    // enabled surface reach AP Integrated Intelligence.
    // On any setup/inference failure, execution falls through
    // to the original provider failover chain below.
    // ============================================================

    if (
        apUnifiedRouterEnabled(
            requestContext
        )
    ) {
        const unifiedStarted =
            performance.now();

        try {
            apLog(
                "info",
                "route.ap_unified_started",
                {
                    request:
                        requestId,
                    mode:
                        "text",
                    surface:
                        String(
                            requestContext
                                ?.surface ||
                            ""
                        )
                }
            );

            const unifiedStream =
                await apWithTimeout(
                    apIntegrated(
                        messages,
                        requestContext
                    ),
                    apUnifiedRouterTimeoutMs(),
                    "AP Unified Intelligence timed out."
                );

            apLog(
                "info",
                "route.ap_unified_ready",
                {
                    request:
                        requestId,
                    ready_ms:
                        Math.round(
                            performance.now() -
                            unifiedStarted
                        )
                }
            );

            return unifiedStream;
        }
        catch (error) {
            apLog(
                "warn",
                "route.ap_unified_fallback",
                {
                    request:
                        requestId,
                    fallback:
                        "existing-provider-chain",
                    ...apErrorFields(
                        error
                    )
                }
            );

            /*
             * Deliberately continue into the exact existing
             * Groq -> Gemini -> DeepSeek -> OpenRouter path.
             */
        }
    }

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
        messages,
        requestId
    );

}
