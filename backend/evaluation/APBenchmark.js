import { solveAP } from "../intelligence/APIntelligenceCore.js";

const cases = [
    ["Math", "What is 37 × 94? Show a short calculation."],
    ["Science", "Explain photosynthesis at Class 10 level in five concise points."],
    ["Coding", "Find the bug: function add(a,b){ return a-b } and correct it."],
    ["Reasoning", "All roses are flowers. Some flowers fade quickly. Does it follow that some roses fade quickly? Explain."],
    ["Writing", "Rewrite this professionally: 'send the report fast because i need it now'."],
];

async function main() {
    const results = [];

    for (const [name, prompt] of cases) {
        const started = Date.now();
        try {
            const result = await solveAP([{ role: "user", content: prompt }]);
            results.push({
                name,
                ok: true,
                durationMs: Date.now() - started,
                confidence: result.confidence,
                preview: result.answer.slice(0, 180).replace(/\s+/g, " "),
            });
        } catch (error) {
            results.push({
                name,
                ok: false,
                durationMs: Date.now() - started,
                confidence: 0,
                preview: error?.message || String(error),
            });
        }
    }

    console.table(results);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
