import {
    solveAP
} from "../intelligence/APIntelligenceCore.js";

const cases = [
    {
        name:
            "Arithmetic",

        prompt:
            "Calculate 37 × 94. Give the exact answer and one short calculation.",

        assert:
            answer =>
                /\b3478\b/.test(
                    String(answer).replace(/,/g, "")
                )
    },
    {
        name:
            "Logic",

        prompt:
            "All roses are flowers. Some flowers fade quickly. Does it logically follow that some roses fade quickly? Answer yes or no and explain.",

        assert:
            answer =>
                /\b(no|does not|doesn't)\b/i.test(
                    answer
                )
    },
    {
        name:
            "Code",

        prompt:
            "Write JavaScript code that removes duplicate strings from an array while preserving the original order.",

        assert:
            answer =>
                /Set\s*\(|new\s+Set|\.filter\s*\(/i.test(
                    answer
                )
    },
    {
        name:
            "Science",

        prompt:
            "Why does Earth's daytime sky usually appear blue? Give a concise scientifically accurate explanation.",

        assert:
            answer =>
                /rayleigh/i.test(
                    answer
                ) &&
                /scatter/i.test(
                    answer
                ) &&
                !/blue\s+(?:light\s+)?(?:has|is)\s+(?:the\s+)?shortest/i.test(
                    answer
                )
    },
    {
        name:
            "Instruction",

        prompt:
            "Reply with exactly these four words: AP QUALITY GATE PASSED",

        assert:
            answer =>
                answer.trim() ===
                "AP QUALITY GATE PASSED"
    }
];

async function main() {
    const rows = [];

    for (
        const test of cases
    ) {
        const started =
            Date.now();

        try {
            const result =
                await solveAP([
                    {
                        role:
                            "user",
                        content:
                            test.prompt
                    }
                ]);

            rows.push({
                name:
                    test.name,

                returned:
                    true,

                assertion:
                    Boolean(
                        test.assert(
                            result.answer
                        )
                    ),

                confidence:
                    result.confidence
                        .toFixed(2),

                quality:
                    result
                        .quality
                        ?.pass
                        ? "PASS"
                        : "FAIL",

                verifier:
                    result
                        .verification
                        ?.method,

                durationMs:
                    Date.now() -
                    started,

                preview:
                    result.answer
                        .slice(
                            0,
                            160
                        )
                        .replace(
                            /\s+/g,
                            " "
                        )
            });
        } catch (error) {
            rows.push({
                name:
                    test.name,

                returned:
                    false,

                assertion:
                    false,

                confidence:
                    "0.00",

                quality:
                    "FAIL",

                verifier:
                    "error",

                durationMs:
                    Date.now() -
                    started,

                preview:
                    error?.message ||
                    String(error)
            });
        }
    }

    console.table(rows);

    const passed =
        rows.filter(
            row =>
                row.returned &&
                row.assertion &&
                row.quality ===
                    "PASS"
        ).length;

    console.log(
        `\nAP V2 QUALITY RESULT: ${passed}/${rows.length}`
    );

    if (
        passed !==
        rows.length
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
