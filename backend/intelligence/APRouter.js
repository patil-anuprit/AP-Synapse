import { unique } from "./APUtils.js";

export function routeIntent(intent) {
    const category = intent?.category || "general";

    const mapping = {
        code: ["code", "reasoning", "general"],
        reasoning: ["reasoning", "general", "judge"],
        research: ["reasoning", "general", "judge"],
        planning: ["reasoning", "general", "code"],
        creative: ["general", "reasoning"],
        summarization: ["fast", "general"],
        vision: ["vision", "reasoning", "general"],
        general: ["general", "reasoning", "fast"],
    };

    let roles = mapping[category] || mapping.general;

    if (!intent?.needsCouncil) {
        roles = [roles[0]];
    }

    return {
        primaryRole: roles[0],
        councilRoles: unique(roles).slice(0, 3),
        verify: Boolean(intent?.needsVerification),
    };
}
