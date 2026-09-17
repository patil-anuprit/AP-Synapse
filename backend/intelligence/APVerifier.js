import { completeWithRole } from "../models/APModelClient.js";
import {
    safeJsonParse,
    clamp,
    lastUserText
} from "./APUtils.js";
import {
    runDeterministicChecks
} from "./APDeterministicChecks.js";
import {
    evaluateAnswerQuality
} from "./APQualityGate.js";

async function enrichCandidate(
    messages,
    candidate,
    intent
) {
    const prompt =
        lastUserText(messages);

    const quality =
        evaluateAnswerQuality(
            candidate.text,
            intent,
            prompt
        );

    const deterministic =
        await runDeterministicChecks({
            prompt,
            answer:
                candidate.text,
            intent
        });

    let baseScore = 0;

    baseScore +=
        quality.pass
            ? 2
            : -quality.issues.length;

    if (
        deterministic.checkedCount
    ) {
        baseScore +=
            deterministic.pass
                ? 2
                : -3;
    }

    if (
        candidate.role ===
        "reasoning"
    ) {
        baseScore += 0.25;
    }

    if (
        candidate.role ===
        "code"
    ) {
        baseScore += 0.2;
    }

    return {
        ...candidate,
        quality,
        deterministic,
        baseScore
    };
}

function deterministicWinner(
    enriched
) {
    const valid =
        enriched
            .filter(
                item =>
                    item.ok &&
                    item.text &&
                    item.text.trim()
            )
            .sort(
                (a, b) =>
                    b.baseScore -
                    a.baseScore
            );

    if (!valid.length) {
        throw new Error(
            "AP Council produced no valid candidate answers."
        );
    }

    return {
        winner: valid[0],

        confidence:
            clamp(
                0.58 +
                    Math.max(
                        0,
                        valid[0].baseScore
                    ) *
                        0.06,
                0.45,
                0.86
            ),

        issues:
            (
                valid[0].quality &&
                valid[0].quality.issues
            ) ||
            [],

        method:
            "deterministic-ranker"
    };
}

export async function verifyCandidates(
    messages,
    candidates,
    intent
) {
    const enriched =
        await Promise.all(
            candidates.map(
                candidate =>
                    enrichCandidate(
                        messages,
                        candidate,
                        intent
                    )
            )
        );

    const valid =
        enriched.filter(
            item =>
                item.ok &&
                item.text &&
                item.text.trim()
        );

    if (!valid.length) {
        throw new Error(
            "No valid AP intelligence candidate was produced."
        );
    }

    if (valid.length === 1) {
        const selected =
            deterministicWinner(
                enriched
            );

        return {
            ...selected,
            winnerIndex:
                enriched.indexOf(
                    selected.winner
                )
        };
    }

    const payload =
        valid.map(
            (
                candidate,
                index
            ) => ({
                index,
                role:
                    candidate.role,
                answer:
                    candidate.text,
                quality:
                    candidate.quality,
                deterministic:
                    candidate.deterministic
            })
        );

    try {
        const raw =
            await completeWithRole(
                "judge",
                [
                    {
                        role:
                            "system",

                        content:
                            "You are AP Verifier. Compare candidate answers for correctness, relevance, consistency, instruction-following, and unsupported claims. " +
                            "Respect deterministic failures as strong negative evidence. " +
                            'Return ONLY JSON: {"winner":0,"confidence":0.0,"issues":["..."]}.'
                    },
                    {
                        role:
                            "user",

                        content:
                            "Original conversation:\n" +
                            JSON.stringify(
                                messages
                            ) +
                            "\n\nCandidates:\n" +
                            JSON.stringify(
                                payload
                            )
                    }
                ],
                {
                    temperature:
                        0.05,
                    maxTokens:
                        700
                }
            );

        const parsed =
            safeJsonParse(raw);

        if (
            !parsed ||
            !Number.isInteger(
                parsed.winner
            ) ||
            !valid[
                parsed.winner
            ]
        ) {
            throw new Error(
                "Invalid judge response"
            );
        }

        const winner =
            valid[
                parsed.winner
            ];

        const penalty =
            (
                winner.deterministic &&
                winner.deterministic.failureCount
            )
                ? 0.25
                : 0;

        return {
            winner,

            winnerIndex:
                enriched.indexOf(
                    winner
                ),

            confidence:
                clamp(
                    Number(
                        parsed.confidence === undefined
                            ? 0.7
                            : parsed.confidence
                    ) -
                        penalty,
                    0,
                    1
                ),

            issues:
                Array.isArray(
                    parsed.issues
                )
                    ? parsed.issues.slice(
                          0,
                          8
                      )
                    : [],

            method:
                "hybrid-model-judge"
        };
    } catch {
        const selected =
            deterministicWinner(
                enriched
            );

        return {
            ...selected,
            winnerIndex:
                enriched.indexOf(
                    selected.winner
                )
        };
    }
}
