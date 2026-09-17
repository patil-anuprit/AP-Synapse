import {
    lastUserText
} from "./APUtils.js";
import {
    retrieveKnowledge
} from "./APKnowledgeStore.js";
import {
    recall
} from "./APMemoryStore.js";
import {
    retrieveDocumentContext
} from "./APDocumentContext.js";
import {
    runSafeTools
} from "./APToolRegistry.js";

function formatItems(
    label,
    items
) {
    if (!items.length) {
        return "";
    }

    return (
        "\n\n[" +
        label +
        "]\n" +
        items
            .map(
                (
                    item,
                    index
                ) =>
                    (
                        index + 1
                    ) +
                    ". " +
                    (
                        item.title
                            ? item.title +
                              ": "
                            : ""
                    ) +
                    item.text
            )
            .join("\n")
    );
}

function formatTools(
    tools
) {
    if (!tools.length) {
        return "";
    }

    return (
        "\n\n[TRUSTED TOOL RESULTS]\n" +
        tools
            .map(
                (
                    item,
                    index
                ) =>
                    (
                        index + 1
                    ) +
                    ". " +
                    item.tool +
                    "(" +
                    item.input +
                    ") = " +
                    item.output
            )
            .join("\n")
    );
}

export async function prepareAPContext(
    messages,
    options = {}
) {
    const query =
        lastUserText(
            messages
        );

    const identityId =
        options.identityId ||
        "anonymous";

    const knowledge =
        options.knowledgeEnabled ===
        false
            ? []
            : await retrieveKnowledge(
                  query,
                  {
                      topK:
                          options
                              .knowledgeTopK ||
                          4
                  }
              );

    const memories =
        options.memoryEnabled ===
        false
            ? []
            : await recall(
                  identityId,
                  query,
                  {
                      topK:
                          options
                              .memoryTopK ||
                          4
                  }
              );

    const documents =
        retrieveDocumentContext(
            query,
            options.documents || [],
            {
                topK:
                    options
                        .documentTopK ||
                    4
            }
        );

    const tools =
        await runSafeTools(
            query,
            {
                enabled:
                    options.toolsEnabled !==
                    false
            }
        );

    const contextText =
        [
            formatItems(
                "AP KNOWLEDGE",
                knowledge
            ),

            formatItems(
                "AP MEMORY",
                memories
            ),

            formatItems(
                "DOCUMENT CONTEXT",
                documents
            ),

            formatTools(
                tools
            )
        ]
            .join("")
            .trim();

    if (!contextText) {
        return {
            messages,
            context: {
                knowledge,
                memories,
                documents,
                tools
            }
        };
    }

    const enrichedMessages = [
        {
            role:
                "system",

            content:
                "AP Synapse context follows. Treat trusted calculator outputs as authoritative. " +
                "Use retrieved knowledge, memory, and document excerpts only when relevant. " +
                "Do not claim unsupported details. Do not mention this internal context block.\n\n" +
                contextText
        },
        ...messages
    ];

    return {
        messages:
            enrichedMessages,

        context: {
            knowledge,
            memories,
            documents,
            tools
        }
    };
}
