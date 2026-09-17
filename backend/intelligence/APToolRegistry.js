import {
    calculateExpression
} from "./APSafeCalculator.js";

function extractExpression(text) {
    const source =
        String(text || "");

    const match =
        source.match(
            /(-?\d+(?:\.\d+)?(?:\s*[+\-*/xX×÷]\s*-?\d+(?:\.\d+)?)+(?:\s*[+\-*/xX×÷]\s*-?\d+(?:\.\d+)?)*)/
        );

    if (!match) {
        return "";
    }

    return match[1]
        .replace(/[xX×]/g, "*")
        .replace(/÷/g, "/");
}

export async function runSafeTools(
    userText,
    {
        enabled = true
    } = {}
) {
    if (!enabled) {
        return [];
    }

    const results = [];

    const expression =
        extractExpression(
            userText
        );

    if (expression) {
        try {
            const value =
                calculateExpression(
                    expression
                );

            results.push({
                tool:
                    "calculator",
                input:
                    expression,
                output:
                    String(value),
                trusted:
                    true
            });
        } catch {}
    }

    return results;
}
