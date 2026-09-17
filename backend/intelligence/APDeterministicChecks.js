import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

function extractJavascript(text) {
    const value = String(text || "");

    const fenced =
        value.match(
            /```(?:javascript|js)\s*([\s\S]*?)```/i
        );

    return fenced?.[1]?.trim() || "";
}

function nodeCheck(source) {
    return new Promise(async resolve => {
        if (!source) {
            resolve({
                checked: false,
                ok: null,
                reason:
                    "no-javascript-block"
            });
            return;
        }

        const file =
            path.join(
                os.tmpdir(),
                "ap-syntax-" +
                    crypto
                        .randomBytes(8)
                        .toString("hex") +
                    ".js"
            );

        try {
            await fs.writeFile(
                file,
                source,
                "utf8"
            );

            execFile(
                process.execPath,
                ["--check", file],
                {
                    timeout: 5000,
                    windowsHide: true
                },
                async error => {
                    try {
                        await fs.unlink(file);
                    } catch {}

                    resolve({
                        checked: true,
                        ok: !error,
                        reason:
                            error
                                ? "javascript-syntax-error"
                                : "javascript-syntax-valid"
                    });
                }
            );
        } catch {
            try {
                await fs.unlink(file);
            } catch {}

            resolve({
                checked: false,
                ok: null,
                reason:
                    "syntax-check-unavailable"
            });
        }
    });
}

function arithmeticCheck(
    prompt,
    answer
) {
    const source =
        String(prompt || "");

    const result =
        String(answer || "");

    const multiply =
        source.match(
            /\b(-?\d+(?:\.\d+)?)\s*[x×*]\s*(-?\d+(?:\.\d+)?)\b/i
        );

    if (multiply) {
        const expected =
            Number(multiply[1]) *
            Number(multiply[2]);

        return {
            checked: true,
            ok:
                result.includes(
                    String(expected)
                ),
            expected,
            reason:
                "simple-multiplication"
        };
    }

    const divide =
        source.match(
            /\b(-?\d+(?:\.\d+)?)\s*[/÷]\s*(-?\d+(?:\.\d+)?)\b/
        );

    if (
        divide &&
        Number(divide[2]) !== 0
    ) {
        const expected =
            Number(divide[1]) /
            Number(divide[2]);

        return {
            checked: true,
            ok:
                result.includes(
                    String(expected)
                ),
            expected,
            reason:
                "simple-division"
        };
    }

    return {
        checked: false,
        ok: null,
        reason:
            "no-safe-arithmetic-pattern"
    };
}

export async function runDeterministicChecks({
    prompt,
    answer,
    intent
}) {
    const checks = [];

    if (intent?.flags?.math) {
        checks.push({
            type: "arithmetic",
            ...arithmeticCheck(
                prompt,
                answer
            )
        });
    }

    if (
        intent?.category === "code"
    ) {
        checks.push({
            type:
                "javascript-syntax",
            ...(await nodeCheck(
                extractJavascript(answer)
            ))
        });
    }

    const checked =
        checks.filter(
            item => item.checked
        );

    const failures =
        checked.filter(
            item => item.ok === false
        );

    return {
        checks,
        pass:
            failures.length === 0,
        checkedCount:
            checked.length,
        failureCount:
            failures.length
    };
}
