import {
    promises as fs
} from "node:fs";

import {
    apUnifiedRouterEnabled
} from "../services/router.js";

async function main() {
    const originalEnabled =
        process.env
            .AP_UNIFIED_INTELLIGENCE_ENABLED;

    const originalSurfaces =
        process.env
            .AP_UNIFIED_INTELLIGENCE_SURFACES;

    const checks = [];

    try {
        process.env
            .AP_UNIFIED_INTELLIGENCE_ENABLED =
            "false";

        process.env
            .AP_UNIFIED_INTELLIGENCE_SURFACES =
            "chat";

        checks.push({
            name:
                "Flag OFF preserves legacy route",
            pass:
                apUnifiedRouterEnabled({
                    surface:
                        "chat"
                }) === false
        });

        process.env
            .AP_UNIFIED_INTELLIGENCE_ENABLED =
            "true";

        checks.push({
            name:
                "Chat surface can enable AP Unified",
            pass:
                apUnifiedRouterEnabled({
                    surface:
                        "chat"
                }) === true
        });

        checks.push({
            name:
                "Aprisha is excluded by default",
            pass:
                apUnifiedRouterEnabled({
                    surface:
                        "aprisha"
                }) === false
        });

        checks.push({
            name:
                "Unlabeled callers stay legacy",
            pass:
                apUnifiedRouterEnabled(
                    {}
                ) === false
        });

        process.env
            .AP_UNIFIED_INTELLIGENCE_SURFACES =
            "chat,aprisha";

        checks.push({
            name:
                "Surface allowlist is explicit",
            pass:
                apUnifiedRouterEnabled({
                    surface:
                        "aprisha"
                }) === true
        });

        const router =
            await fs.readFile(
                new URL(
                    "../services/router.js",
                    import.meta.url
                ),
                "utf8"
            );

        const server =
            await fs.readFile(
                new URL(
                    "../server.js",
                    import.meta.url
                ),
                "utf8"
            );

        const android =
            await fs.readFile(
                new URL(
                    "../services/aprishaAgentRouter.js",
                    import.meta.url
                ),
                "utf8"
            );

        const desktop =
            await fs.readFile(
                new URL(
                    "../services/aprishaDesktopRouter.js",
                    import.meta.url
                ),
                "utf8"
            );

        const unifiedIndex =
            router.indexOf(
                "AP_UNIFIED_ROUTER_STAGE5_TEXT_PRIMARY"
            );

        const imageGenerationIndex =
            router.indexOf(
                "const wantsImageGeneration"
            );

        checks.push({
            name:
                "Unified text route follows image routing",
            pass:
                imageGenerationIndex >=
                    0 &&
                unifiedIndex >
                    imageGenerationIndex
        });

        const afterUnified =
            router.slice(
                Math.max(
                    0,
                    unifiedIndex
                )
            );

        checks.push({
            name:
                "Legacy provider fallback preserved",
            pass:
                [
                    "Groq",
                    "Gemini",
                    "DeepSeek",
                    "OpenRouter"
                ]
                    .every(
                        name =>
                            new RegExp(
                                "name\\s*:\\s*[\"']" +
                                name +
                                "[\"']"
                            )
                                .test(
                                    afterUnified
                                )
                    )
        });

        checks.push({
            name:
                "/chat explicitly selects chat surface",
            pass:
                server.includes(
                    "AP_UNIFIED_CHAT_SURFACE_STAGE5"
                ) &&
                /surface\s*:\s*["']chat["']/
                    .test(server)
        });

        checks.push({
            name:
                "Aprisha Android caller unchanged",
            pass:
                android.includes(
                    "createAIStream(messages)"
                ) &&
                !android.includes(
                    "surface: \"chat\""
                )
        });

        checks.push({
            name:
                "Aprisha Desktop caller unchanged",
            pass:
                desktop.includes(
                    "createAIStream(messages)"
                ) &&
                !desktop.includes(
                    "surface:\"chat\""
                ) &&
                !desktop.includes(
                    'surface: "chat"'
                )
        });
    }
    finally {
        if (
            originalEnabled ===
            undefined
        ) {
            delete process.env
                .AP_UNIFIED_INTELLIGENCE_ENABLED;
        } else {
            process.env
                .AP_UNIFIED_INTELLIGENCE_ENABLED =
                originalEnabled;
        }

        if (
            originalSurfaces ===
            undefined
        ) {
            delete process.env
                .AP_UNIFIED_INTELLIGENCE_SURFACES;
        } else {
            process.env
                .AP_UNIFIED_INTELLIGENCE_SURFACES =
                originalSurfaces;
        }
    }

    console.table(checks);

    const passed =
        checks.filter(
            check =>
                check.pass
        ).length;

    console.log(
        `\nAP STAGE 5 ROUTER CONTRACT RESULT: ${passed}/${checks.length}`
    );

    if (
        passed !==
        checks.length
    ) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
