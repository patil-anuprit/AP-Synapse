function cleanText(value, max = 12000) {
    const text = String(value ?? "")
        .replace(/\r\n/g, "\n")
        .trim();

    if (!text) {
        return "";
    }

    return text.slice(0, max);
}

function normalizeMessageArray(raw) {
    if (Array.isArray(raw)) {
        return raw;
    }

    if (Array.isArray(raw?.messages)) {
        return raw.messages;
    }

    if (Array.isArray(raw?.conversation)) {
        return raw.conversation;
    }

    if (Array.isArray(raw?.items)) {
        return raw.items;
    }

    return [];
}

function normalizeContextValue(raw) {
    if (!raw) {
        return [];
    }

    if (typeof raw === "string") {
        return raw.trim()
            ? [raw.trim()]
            : [];
    }

    if (Array.isArray(raw)) {
        return raw
            .map(item => {
                if (typeof item === "string") {
                    return item.trim();
                }

                if (item?.content) {
                    return cleanText(item.content, 5000);
                }

                if (item?.text) {
                    return cleanText(item.text, 5000);
                }

                try {
                    return cleanText(
                        JSON.stringify(item),
                        5000
                    );
                } catch {
                    return "";
                }
            })
            .filter(Boolean);
    }

    if (raw?.context) {
        return normalizeContextValue(raw.context);
    }

    try {
        const text = JSON.stringify(raw);

        return text
            ? [cleanText(text, 8000)]
            : [];
    } catch {
        return [];
    }
}

function extractDocuments(messages) {
    const documents = [];

    for (const item of messages) {
        if (item?.role !== "document") {
            continue;
        }

        const content = item?.content;

        if (typeof content === "string") {
            const text = cleanText(content, 30000);

            if (text) {
                documents.push({
                    id: "conversation-document-" + documents.length,
                    title: "Uploaded document",
                    text
                });
            }

            continue;
        }

        if (!content || typeof content !== "object") {
            continue;
        }

        /*
         * Stage 4 text context intentionally excludes raw image data.
         * Vision stays on the existing image/vision path until its
         * dedicated integration stage.
         */
        if (
            content.type === "image" ||
            String(content.dataUrl || "")
                .startsWith("data:image/")
        ) {
            continue;
        }

        const text =
            cleanText(
                content.text ??
                content.content ??
                content.data ??
                "",
                30000
            );

        if (!text) {
            continue;
        }

        documents.push({
            id:
                cleanText(
                    content.id ||
                    content.name ||
                    "conversation-document-" + documents.length,
                    200
                ),
            title:
                cleanText(
                    content.title ||
                    content.name ||
                    "Uploaded document",
                    300
                ),
            text
        });
    }

    return documents;
}

function normalizeExplicitDocument(document) {
    if (!document) {
        return [];
    }

    if (typeof document === "string") {
        const text =
            cleanText(
                document,
                30000
            );

        return text
            ? [{
                id: "request-document",
                title: "Request document",
                text
            }]
            : [];
    }

    if (typeof document !== "object") {
        return [];
    }

    if (
        document.type === "image" ||
        String(document.dataUrl || "")
            .startsWith("data:image/")
    ) {
        return [];
    }

    const text =
        cleanText(
            document.text ??
            document.content ??
            document.data ??
            "",
            30000
        );

    if (!text) {
        return [];
    }

    return [{
        id:
            cleanText(
                document.id ||
                document.name ||
                "request-document",
                200
            ),
        title:
            cleanText(
                document.title ||
                document.name ||
                "Request document",
                300
            ),
        text
    }];
}

function normalizeSources(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .map((source, index) => ({
            index,
            title:
                cleanText(
                    source?.title ||
                    source?.name ||
                    "Source " + (index + 1),
                    500
                ),
            url:
                cleanText(
                    source?.url ||
                    source?.link ||
                    "",
                    2000
                ),
            content:
                cleanText(
                    source?.content ||
                    source?.snippet ||
                    source?.description ||
                    "",
                    4000
                ),
            score:
                Number.isFinite(
                    Number(source?.score)
                )
                    ? Number(source.score)
                    : null
        }))
        .filter(source =>
            source.title ||
            source.url ||
            source.content
        )
        .slice(0, 8);
}

async function loadDefaultAdapters() {
    const [
        memoryModule,
        personalizationModule,
        webModule
    ] = await Promise.all([
        import("../memory/conversationStore.js"),
        import("../services/personalizationService.js"),
        import("../services/webSources.js")
    ]);

    return {
        async getConversation(sessionId) {
            if (
                !sessionId ||
                typeof memoryModule
                    .getConversation !== "function"
            ) {
                return [];
            }

            return memoryModule
                .getConversation(sessionId);
        },

        async getPersonalizationContext(identityId) {
            if (
                !identityId ||
                typeof personalizationModule
                    .getPersonalizationContext !== "function"
            ) {
                return [];
            }

            /*
             * Passing only identityId is compatible with the
             * audited production call boundary. If the existing
             * function accepts optional extra parameters, they
             * retain their defaults.
             */
            return personalizationModule
                .getPersonalizationContext(identityId);
        },

        async searchWebSources(query) {
            if (
                !query ||
                typeof webModule
                    .searchWebSources !== "function"
            ) {
                return [];
            }

            return webModule
                .searchWebSources(query);
        }
    };
}

export async function inspectRealIntegrationContracts() {
    const [
        memoryModule,
        personalizationModule,
        webModule,
        documentModule
    ] = await Promise.all([
        import("../memory/conversationStore.js"),
        import("../services/personalizationService.js"),
        import("../services/webSources.js"),
        import("../services/documentReader.js")
    ]);

    return {
        conversation:
            typeof memoryModule
                .getConversation === "function",

        personalization:
            typeof personalizationModule
                .getPersonalizationContext === "function",

        web:
            typeof webModule
                .searchWebSources === "function",

        documentReader:
            typeof documentModule
                .readDocument === "function"
    };
}

export async function buildAPRealContext(
    messages,
    requestContext = {},
    adapterOverrides = {}
) {
    const adapters =
        Object.keys(adapterOverrides).length
            ? adapterOverrides
            : await loadDefaultAdapters();

    const sessionId =
        cleanText(
            requestContext.sessionId ||
            requestContext.session ||
            "",
            500
        );

    const identityId =
        cleanText(
            requestContext.identityId ||
            requestContext.personalizationId ||
            "",
            500
        );

    const query =
        cleanText(
            requestContext.query ||
            [...messages]
                .reverse()
                .find(
                    item =>
                        item?.role === "user"
                )
                ?.content ||
            "",
            6000
        );

    let conversation = [];
    let personalization = [];
    let sources = [];

    if (
        requestContext.conversationEnabled !== false &&
        sessionId &&
        typeof adapters.getConversation === "function"
    ) {
        try {
            conversation =
                normalizeMessageArray(
                    await adapters
                        .getConversation(sessionId)
                );
        } catch {
            conversation = [];
        }
    }

    if (
        requestContext.personalizationEnabled !== false &&
        identityId &&
        typeof adapters.getPersonalizationContext === "function"
    ) {
        try {
            personalization =
                normalizeContextValue(
                    await adapters
                        .getPersonalizationContext(
                            identityId
                        )
                );
        } catch {
            personalization = [];
        }
    }

    const shouldSearchWeb =
        requestContext.webSearch === true ||
        requestContext.webEnabled === true;

    if (
        shouldSearchWeb &&
        query &&
        typeof adapters.searchWebSources === "function"
    ) {
        try {
            sources =
                normalizeSources(
                    await adapters
                        .searchWebSources(query)
                );
        } catch {
            sources = [];
        }
    }

    const documents = [
        ...extractDocuments(conversation),
        ...extractDocuments(messages),
        ...normalizeExplicitDocument(
            requestContext.document
        )
    ];

    const personalizationText =
        personalization
            .slice(0, 12)
            .join("\n");

    const conversationText =
        conversation
            .filter(
                item =>
                    item?.role !== "document"
            )
            .slice(-18)
            .map(item => {
                const role =
                    cleanText(
                        item?.role || "unknown",
                        40
                    );

                const content =
                    cleanText(
                        item?.content,
                        3000
                    );

                return content
                    ? role + ": " + content
                    : "";
            })
            .filter(Boolean)
            .join("\n");

    const webText =
        sources
            .map(
                (source, index) =>
                    [
                        "Source " + (index + 1),
                        source.title,
                        source.url,
                        source.content
                    ]
                        .filter(Boolean)
                        .join(" | ")
            )
            .join("\n");

    const contextBlocks = [];

    if (personalizationText) {
        contextBlocks.push({
            label:
                "AP SYNAPSE PERSONALIZATION",
            text:
                personalizationText
        });
    }

    if (conversationText) {
        contextBlocks.push({
            label:
                "AP SYNAPSE CONVERSATION MEMORY",
            text:
                conversationText
        });
    }

    if (webText) {
        contextBlocks.push({
            label:
                "AP SYNAPSE WEB SOURCES",
            text:
                webText
        });
    }

    return {
        identityId,
        sessionId,
        query,
        documents,
        sources,
        contextBlocks,
        diagnostics: {
            conversationMessages:
                conversation.length,
            personalizationItems:
                personalization.length,
            documents:
                documents.length,
            sources:
                sources.length
        }
    };
}
