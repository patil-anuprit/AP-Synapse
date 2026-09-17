import {
    buildAPRealContext,
    inspectRealIntegrationContracts
} from "../intelligence/index.js";

async function main() {
    const checks = [];

    const contracts =
        await inspectRealIntegrationContracts();

    checks.push({
        name:
            "Conversation store contract",
        pass:
            contracts.conversation,
        detail:
            String(
                contracts.conversation
            )
    });

    checks.push({
        name:
            "Personalization contract",
        pass:
            contracts.personalization,
        detail:
            String(
                contracts.personalization
            )
    });

    checks.push({
        name:
            "Web source contract",
        pass:
            contracts.web,
        detail:
            String(
                contracts.web
            )
    });

    checks.push({
        name:
            "Document reader contract",
        pass:
            contracts.documentReader,
        detail:
            String(
                contracts.documentReader
            )
    });

    const mockAdapters = {
        async getConversation() {
            return [
                {
                    role: "user",
                    content:
                        "Earlier conversation fact: ALPHA-912."
                },
                {
                    role: "document",
                    content:
                        "Uploaded document fact: DOC-731."
                }
            ];
        },

        async getPersonalizationContext() {
            return [
                "Personalization fact: preferred workspace is graphite."
            ];
        },

        async searchWebSources() {
            return [
                {
                    title:
                        "Stage 4 Test Source",
                    url:
                        "https://example.invalid/stage4",
                    content:
                        "Retrieved source fact: WEB-442."
                }
            ];
        }
    };

    const context =
        await buildAPRealContext(
            [
                {
                    role: "user",
                    content:
                        "Use the available context."
                }
            ],
            {
                sessionId:
                    "stage4-session",
                identityId:
                    "stage4-identity",
                webSearch:
                    true,
                document: {
                    name:
                        "request.txt",
                    text:
                        "Request document fact: REQ-228."
                }
            },
            mockAdapters
        );

    const combined =
        context.contextBlocks
            .map(
                item =>
                    item.label +
                    "\n" +
                    item.text
            )
            .join("\n") +
        "\n" +
        context.documents
            .map(
                item =>
                    item.text
            )
            .join("\n");

    checks.push({
        name:
            "Real context bridge",
        pass:
            combined.includes(
                "ALPHA-912"
            ) &&
            combined.includes(
                "graphite"
            ) &&
            combined.includes(
                "WEB-442"
            ) &&
            combined.includes(
                "DOC-731"
            ) &&
            combined.includes(
                "REQ-228"
            ),
        detail:
            JSON.stringify(
                context.diagnostics
            )
    });

    checks.push({
        name:
            "Structured web sources",
        pass:
            context.sources.length ===
                1 &&
            context.sources[0]
                .content
                .includes(
                    "WEB-442"
                ),
        detail:
            context.sources[0]
                ?.title ||
            ""
    });

    console.table(checks);

    const passed =
        checks.filter(
            item =>
                item.pass
        ).length;

    console.log(
        `\nAP STAGE 4 INTEGRATION RESULT: ${passed}/${checks.length}`
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
