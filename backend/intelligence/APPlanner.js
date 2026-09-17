import { lastUserText } from "./APUtils.js";

export function buildExecutionPlan(messages = [], intent = {}, route = {}) {
    const text = lastUserText(messages);

    const plan = {
        mode:
            intent?.complexity >= 4
                ? "deep"
                : intent?.complexity >= 3
                    ? "deliberate"
                    : "direct",

        objective: text.slice(0, 1200),

        primaryRole:
            route?.primaryRole || "general",

        councilRoles:
            Array.isArray(route?.councilRoles)
                ? route.councilRoles
                : ["general"],

        requireVerification:
            Boolean(route?.verify) ||
            Boolean(intent?.needsVerification),

        checks: [],

        constraints: [
            "Answer the user's actual request.",
            "Do not invent facts.",
            "Do not mention internal routing, models, or hidden analysis."
        ]
    };

    if (intent?.flags?.math) {
        plan.checks.push(
            "Verify numerical calculations independently."
        );
    }

    if (intent?.flags?.code) {
        plan.checks.push(
            "Check code for syntax and logical consistency."
        );
    }

    if (intent?.flags?.research) {
        plan.checks.push(
            "Separate supported claims from uncertain claims."
        );
    }

    if (intent?.image) {
        plan.checks.push(
            "Do not infer visual details that are not actually present."
        );
    }

    if (!plan.checks.length) {
        plan.checks.push(
            "Check relevance, completeness, and internal consistency."
        );
    }

    return plan;
}
