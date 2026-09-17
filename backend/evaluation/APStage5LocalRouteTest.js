const IMPORT_ONLY_KEYS = {
    GROQ_API_KEY:
        "gsk_stage5_local_import_only",

    GEMINI_API_KEY:
        "stage5_local_import_only",

    GOOGLE_API_KEY:
        "stage5_local_import_only",

    OPENROUTER_API_KEY:
        "stage5_local_import_only",

    DEEPSEEK_API_KEY:
        "stage5_local_import_only"
};


async function importRouterWithoutRealProviderKeys() {

    /*
     * Legacy provider modules validate credentials while they
     * are imported.
     *
     * Stage 5 must therefore provide non-functional placeholder
     * values only long enough for Node to load router.js.
     *
     * These are NOT real credentials.
     */

    for (
        const [key, value]
        of Object.entries(
            IMPORT_ONLY_KEYS
        )
    ) {
        process.env[key] =
            value;
    }


    try {

        const module =
            await import(
                "../services/router.js"
            );

        return module.createAIStream;

    }
    finally {

        /*
         * Remove every commercial-provider credential before
         * AP Unified inference begins.
         */

        for (
            const key
            of Object.keys(
                IMPORT_ONLY_KEYS
            )
        ) {
            delete process.env[key];
        }
    }
}


async function collect(stream) {

    let output = "";

    for await (
        const chunk of stream
    ) {

        output +=
            chunk
                ?.choices
                ?.[0]
                ?.delta
                ?.content ||
            "";
    }

    return output.trim();
}


async function main() {

    const createAIStream =
        await importRouterWithoutRealProviderKeys();


    const visibleCommercialKeys =
        Object.keys(
            IMPORT_ONLY_KEYS
        )
            .filter(
                key =>
                    Boolean(
                        process.env[key]
                    )
            );


    console.log(
        "Commercial provider keys visible during inference:",
        visibleCommercialKeys.length
            ? visibleCommercialKeys.join(", ")
            : "NONE"
    );


    if (
        visibleCommercialKeys.length
    ) {

        throw new Error(
            "Commercial provider credentials remained visible after router import."
        );
    }


    const expected =
        "AP STAGE 5 ROUTER ONLINE";


    const stream =
        await createAIStream(
            [
                {
                    role:
                        "user",

                    content:
                        "Reply exactly: " +
                        expected
                }
            ],
            {
                surface:
                    "chat",

                conversationEnabled:
                    false,

                personalizationEnabled:
                    false,

                webSearch:
                    false
            }
        );


    const output =
        await collect(
            stream
        );


    console.log(
        "Stage 5 local output:",
        output
    );


    const pass =
        output ===
        expected;


    console.log(
        "AP STAGE 5 LOCAL ROUTE RESULT:",
        pass
            ? "PASS"
            : "FAIL"
    );


    if (!pass) {
        process.exitCode = 1;
    }
}


main().catch(
    error => {

        console.error(error);

        process.exitCode = 1;
    }
);