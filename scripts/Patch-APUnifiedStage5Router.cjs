const fs = require("fs");
const path = require("path");

const root = process.cwd();

const routerPath =
    path.join(
        root,
        "backend",
        "services",
        "router.js"
    );

const serverPath =
    path.join(
        root,
        "backend",
        "server.js"
    );

function fail(message) {
    throw new Error(message);
}

function eolOf(text) {
    return text.includes("\r\n")
        ? "\r\n"
        : "\n";
}

function withEol(text, eol) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\n/g, eol);
}

function assertContains(
    text,
    needle,
    label
) {
    if (!text.includes(needle)) {
        fail(
            "Expected " +
            label +
            " was not found."
        );
    }
}

function patchRouter(original) {
    if (
        original.includes(
            "AP_UNIFIED_ROUTER_STAGE5"
        )
    ) {
        console.log(
            "Stage 5 router marker already present."
        );

        return original;
    }

    const eol =
        eolOf(original);

    const deepseekImport =
        'import { createStream as deepseek } from "./deepseekService.js";';

    assertContains(
        original,
        deepseekImport,
        "DeepSeek router import"
    );

    let next =
        original.replace(
            deepseekImport,
            deepseekImport +
                eol +
                'import { createStream as apIntegrated } from "./apIntegratedIntelligenceService.js";'
        );

    const observabilityImportEnd =
        '} from "./observability.js";';

    assertContains(
        next,
        observabilityImportEnd,
        "observability import boundary"
    );

    const helperBlock =
withEol(`

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
`, eol);

    next =
        next.replace(
            observabilityImportEnd,
            observabilityImportEnd +
                helperBlock
        );

    const oldSignature =
        "export async function createAIStream(messages) {";

    const newSignature =
        "export async function createAIStream(messages, requestContext = {}) {";

    assertContains(
        next,
        oldSignature,
        "createAIStream one-argument signature"
    );

    next =
        next.replace(
            oldSignature,
            newSignature
        );

    const functionStart =
        next.indexOf(
            newSignature
        );

    if (functionStart < 0) {
        fail(
            "createAIStream signature patch failed."
        );
    }

    const afterFunction =
        next.slice(
            functionStart
        );

    const groqMatch =
        /name\s*:\s*["']Groq["']/m
            .exec(afterFunction);

    if (!groqMatch) {
        fail(
            "Could not locate the normal-text Groq fallback provider."
        );
    }

    const groqIndex =
        functionStart +
        groqMatch.index;

    const textFailoverIndex =
        next.lastIndexOf(
            "return apFailoverStream(",
            groqIndex
        );

    if (
        textFailoverIndex <
        functionStart
    ) {
        fail(
            "Could not locate the normal-text failover call."
        );
    }

    const beforeTextFailover =
        next.slice(
            functionStart,
            textFailoverIndex
        );

    if (
        !beforeTextFailover.includes(
            "wantsImageGeneration"
        )
    ) {
        fail(
            "Safety stop: AP Unified insertion point is not after image-generation detection."
        );
    }

    const unifiedBlock =
withEol(`
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

`, eol);

    next =
        next.slice(
            0,
            textFailoverIndex
        ) +
        unifiedBlock +
        next.slice(
            textFailoverIndex
        );

    const unifiedMarker =
        next.indexOf(
            "AP_UNIFIED_ROUTER_STAGE5_TEXT_PRIMARY"
        );

    const imageDetection =
        next.indexOf(
            "const wantsImageGeneration"
        );

    if (
        imageDetection < 0 ||
        unifiedMarker <= imageDetection
    ) {
        fail(
            "Safety stop: AP Unified route was not placed after image-generation routing."
        );
    }

    for (
        const provider of [
            "Groq",
            "Gemini",
            "DeepSeek",
            "OpenRouter"
        ]
    ) {
        const pattern =
            new RegExp(
                "name\\s*:\\s*[\"']" +
                provider +
                "[\"']",
                "m"
            );

        if (
            !pattern.test(
                next.slice(
                    unifiedMarker
                )
            )
        ) {
            fail(
                "Fallback provider missing after Stage 5 insertion: " +
                provider
            );
        }
    }

    return next;
}

function patchServer(original) {
    if (
        original.includes(
            "AP_UNIFIED_CHAT_SURFACE_STAGE5"
        )
    ) {
        console.log(
            "Stage 5 server marker already present."
        );

        return original;
    }

    const eol =
        eolOf(original);

    const oldCall =
        "const stream = await createAIStream(messages);";

    assertContains(
        original,
        oldCall,
        "server /chat createAIStream call"
    );

    const replacement =
withEol(`// AP_UNIFIED_CHAT_SURFACE_STAGE5
const stream = await createAIStream(
    messages,
    {
        /*
         * The normal /chat request explicitly opts into the
         * feature-flagged AP Unified surface.
         *
         * The server has already assembled conversation memory
         * and personalization into messages, so Stage 5 disables
         * duplicate lookups here.
         *
         * Existing web search continues in parallel below and
         * remains responsible for the frontend source payload.
         */
        surface:
            "chat",

        sessionId,

        identityId:
            apPersonalizationIdentity
                .identityId,

        query:
            originalMessage,

        document:
            uploadedDocument,

        conversationEnabled:
            false,

        personalizationEnabled:
            false,

        webSearch:
            false
    }
);`, eol);

    return original.replace(
        oldCall,
        replacement
    );
}

if (
    !fs.existsSync(routerPath) ||
    !fs.existsSync(serverPath)
) {
    fail(
        "router.js or server.js was not found."
    );
}

const originalRouter =
    fs.readFileSync(
        routerPath,
        "utf8"
    );

const originalServer =
    fs.readFileSync(
        serverPath,
        "utf8"
    );

const patchedRouter =
    patchRouter(
        originalRouter
    );

const patchedServer =
    patchServer(
        originalServer
    );

/*
 * Validate both fully before touching either file.
 */
assertContains(
    patchedRouter,
    "AP_UNIFIED_ROUTER_STAGE5_TEXT_PRIMARY",
    "Stage 5 router marker"
);

assertContains(
    patchedServer,
    "AP_UNIFIED_CHAT_SURFACE_STAGE5",
    "Stage 5 chat marker"
);

try {
    fs.writeFileSync(
        routerPath,
        patchedRouter,
        "utf8"
    );

    fs.writeFileSync(
        serverPath,
        patchedServer,
        "utf8"
    );
}
catch (error) {
    /*
     * Best-effort transaction rollback if the second write fails.
     */
    try {
        fs.writeFileSync(
            routerPath,
            originalRouter,
            "utf8"
        );

        fs.writeFileSync(
            serverPath,
            originalServer,
            "utf8"
        );
    } catch {}

    throw error;
}

console.log(
    "OK: Stage 5 feature-flagged router integration installed."
);
console.log(
    "OK: /chat opts into surface=chat."
);
console.log(
    "OK: Aprisha call sites were not modified."
);
