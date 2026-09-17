import { solveAP } from "../intelligence/APIntelligenceCore.js";
import { getModelRegistry } from "../models/APModelRegistry.js";
import { ollamaHealth } from "../models/APOllamaProvider.js";

const externalKeys = [
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OPENROUTER_API_KEY",
    "DEEPSEEK_API_KEY",
    "ANTHROPIC_API_KEY",
];

const tests = [
    {
        name: "general",
        prompt: "Explain in three short points why the sky appears blue.",
    },
    {
        name: "reasoning",
        prompt: "If a train travels 180 km in 3 hours, what is its average speed? Explain briefly.",
    },
    {
        name: "code",
        prompt: "Write a JavaScript function that removes duplicate strings from an array while preserving order.",
    },
    {
        name: "planning",
        prompt: "Give a concise four-step plan for testing a web application's login flow safely.",
    },
];

async function main() {
    const registry = getModelRegistry();

    console.log("\n============================================================");
    console.log(" AP SYNAPSE — PROVIDER INDEPENDENCE TEST");
    console.log("============================================================");
    console.log("Runtime:", registry.runtime);

    const presentExternalKeys = externalKeys.filter(key => Boolean(process.env[key]));
    console.log(
        "Commercial-provider keys visible to this process:",
        presentExternalKeys.length ? presentExternalKeys.join(", ") : "NONE ✅"
    );

    if (registry.runtime === "ollama") {
        await ollamaHealth(registry.ollama.baseUrl);
        console.log("AP-controlled local model server: REACHABLE ✅");
    }

    let passed = 0;

    for (const test of tests) {
        const started = Date.now();

        try {
            const result = await solveAP([
                { role: "user", content: test.prompt }
            ]);

            const ok = Boolean(result.answer && result.answer.length >= 20);
            if (ok) passed++;

            console.log(`\n[${ok ? "PASS" : "FAIL"}] ${test.name}`);
            console.log("Confidence:", result.confidence.toFixed(2));
            console.log("Duration:", Date.now() - started, "ms");
            console.log("Answer:", result.answer.slice(0, 400));
        } catch (error) {
            console.log(`\n[FAIL] ${test.name}`);
            console.log(error?.stack || error);
        }
    }

    console.log("\n============================================================");
    console.log(` RESULT: ${passed}/${tests.length} passed`);
    console.log("============================================================");

    if (passed !== tests.length) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
