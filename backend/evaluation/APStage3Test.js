import {
    promises as fs
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    addKnowledgeDocument,
    retrieveKnowledge,
    remember,
    recall,
    retrieveDocumentContext,
    runSafeTools,
    prepareAPContext
} from "../intelligence/index.js";

async function main() {
    const temp =
        await fs.mkdtemp(
            path.join(
                os.tmpdir(),
                "ap-stage3-"
            )
        );

    process.env
        .AP_STAGE3_DATA_DIR =
        temp;

    const checks = [];

    await addKnowledgeDocument({
        id:
            "stage3-knowledge",
        title:
            "AP Stage 3 Reference",
        text:
            "The AP Synapse Stage 3 verification constellation code is ORBIT-731. " +
            "This sentence exists only to test local knowledge retrieval."
    });

    const knowledge =
        await retrieveKnowledge(
            "What is the constellation code ORBIT 731?",
            {
                topK: 3
            }
        );

    checks.push({
        name:
            "Knowledge retrieval",
        pass:
            knowledge.some(
                item =>
                    item.text.includes(
                        "ORBIT-731"
                    )
            ),
        detail:
            knowledge[0]
                ?.text
                ?.slice(
                    0,
                    100
                ) || ""
    });

    await remember({
        identityId:
            "stage3-user",
        text:
            "The preferred Stage 3 testing phrase is titanium sunrise.",
        tags:
            [
                "testing",
                "phrase"
            ]
    });

    const memories =
        await recall(
            "stage3-user",
            "preferred testing phrase titanium sunrise",
            {
                topK: 3
            }
        );

    checks.push({
        name:
            "Scoped persistent memory",
        pass:
            memories.some(
                item =>
                    item.text.includes(
                        "titanium sunrise"
                    )
            ),
        detail:
            memories[0]
                ?.text ||
            ""
    });

    const documents =
        retrieveDocumentContext(
            "What launch code is in the document?",
            [
                {
                    id:
                        "doc-1",
                    title:
                        "Launch Note",
                    text:
                        "Internal development note: the document test launch code is NOVA-442."
                }
            ],
            {
                topK: 3
            }
        );

    checks.push({
        name:
            "Document context",
        pass:
            documents.some(
                item =>
                    item.text.includes(
                        "NOVA-442"
                    )
            ),
        detail:
            documents[0]
                ?.text ||
            ""
    });

    const tools =
        await runSafeTools(
            "Calculate 37 * 94"
        );

    checks.push({
        name:
            "Safe calculator tool",
        pass:
            tools.some(
                item =>
                    item.tool ===
                        "calculator" &&
                    item.output ===
                        "3478"
            ),
        detail:
            JSON.stringify(
                tools
            )
    });

    const prepared =
        await prepareAPContext(
            [
                {
                    role:
                        "user",
                    content:
                        "Use ORBIT-731 and calculate 37 * 94."
                }
            ],
            {
                identityId:
                    "stage3-user",

                documents: [
                    {
                        id:
                            "doc-1",
                        title:
                            "Launch Note",
                        text:
                            "The document test launch code is NOVA-442."
                    }
                ]
            }
        );

    const contextMessage =
        prepared.messages[0]
            ?.content ||
        "";

    checks.push({
        name:
            "Unified context assembly",
        pass:
            contextMessage.includes(
                "ORBIT-731"
            ) &&
            contextMessage.includes(
                "3478"
            ),
        detail:
            contextMessage.slice(
                0,
                180
            )
    });

    console.table(
        checks.map(
            item => ({
                name:
                    item.name,
                pass:
                    item.pass,
                detail:
                    item.detail
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .slice(
                            0,
                            120
                        )
            })
        )
    );

    const passed =
        checks.filter(
            item =>
                item.pass
        ).length;

    console.log(
        `\nAP STAGE 3 RESULT: ${passed}/${checks.length}`
    );

    await fs.rm(
        temp,
        {
            recursive: true,
            force: true
        }
    );

    if (
        passed !==
        checks.length
    ) {
        process.exitCode = 1;
    }
}

main().catch(
    error => {
        console.error(
            error
        );

        process.exitCode = 1;
    }
);
