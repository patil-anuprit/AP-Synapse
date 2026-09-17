import {
    classifyIntent
} from "./APIntentEngine.js";
import {
    routeIntent
} from "./APRouter.js";
import {
    buildExecutionPlan
} from "./APPlanner.js";
import {
    runCouncil
} from "./APCouncil.js";
import {
    verifyCandidates
} from "./APVerifier.js";
import {
    synthesizeAnswer
} from "./APSynthesizer.js";
import {
    calculateConfidence
} from "./APConfidence.js";
import {
    evaluateAnswerQuality
} from "./APQualityGate.js";
import {
    lastUserText
} from "./APUtils.js";
import {
    prepareAPContext
} from "./APContextEngine.js";

export async function solveAP(
    messages,
    options = {}
) {
    if (
        !Array.isArray(messages) ||
        !messages.length
    ) {
        throw new Error(
            "AP Intelligence Core requires a non-empty messages array."
        );
    }

    const started =
        Date.now();

    const originalPrompt =
        lastUserText(
            messages
        );

    const prepared =
        await prepareAPContext(
            messages,
            options
        );

    const workingMessages =
        prepared.messages;

    const intent =
        classifyIntent(
            messages
        );

    const route =
        routeIntent(
            intent
        );

    const plan =
        buildExecutionPlan(
            messages,
            intent,
            route
        );

    const candidates =
        await runCouncil(
            workingMessages,
            route.councilRoles,
            plan
        );

    const verification =
        await verifyCandidates(
            messages,
            candidates,
            intent
        );

    const answer =
        await synthesizeAnswer(
            workingMessages,
            candidates,
            verification,
            intent
        );

    if (
        !answer ||
        !answer.trim()
    ) {
        throw new Error(
            "AP Intelligence Core produced an empty final answer."
        );
    }

    const quality =
        evaluateAnswerQuality(
            answer,
            intent,
            originalPrompt
        );

    const finalAnswer =
        quality.pass
            ? answer.trim()
            : (
                verification &&
                verification.winner &&
                verification.winner.text &&
                verification.winner.text.trim()
            ) ||
              answer.trim();

    const finalQuality =
        evaluateAnswerQuality(
            finalAnswer,
            intent,
            originalPrompt
        );

    const confidence =
        calculateConfidence({
            intent,
            candidates,
            verification,
            answer:
                finalAnswer
        });

    return {
        answer:
            finalAnswer,

        confidence,

        intent,

        route,

        plan,

        quality:
            finalQuality,

        context: {
            knowledgeCount:
                prepared
                    .context
                    .knowledge
                    .length,

            memoryCount:
                prepared
                    .context
                    .memories
                    .length,

            documentCount:
                prepared
                    .context
                    .documents
                    .length,

            toolCount:
                prepared
                    .context
                    .tools
                    .length,

            tools:
                prepared
                    .context
                    .tools
                    .map(
                        item => ({
                            tool:
                                item.tool,
                            input:
                                item.input,
                            output:
                                item.output
                        })
                    )
        },

        verification: {
            method:
                verification.method,

            confidence:
                verification.confidence,

            winnerIndex:
                verification.winnerIndex,

            issues:
                verification.issues
        },

        telemetry: {
            durationMs:
                Date.now() -
                started,

            candidates:
                candidates.map(
                    item => ({
                        role:
                            item.role,

                        ok:
                            item.ok,

                        latencyMs:
                            item.latencyMs,

                        error:
                            item.ok
                                ? undefined
                                : item.error
                    })
                )
        }
    };
}
