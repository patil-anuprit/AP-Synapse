// ============================================================
// AP SYNAPSE — COMMUNICATION PREFERENCES
// ============================================================

export const DEFAULT_COMMUNICATION_PREFERENCES = Object.freeze({

    security: true,

    important_activity: true,

    task_complete: true,

    research_complete: true,

    learning: true,

    daily_brief: true,

    weekly_digest: true,

    product_update: false

});


export function normalizeCommunicationPreferences(
    preferences = {}
) {

    return {

        ...DEFAULT_COMMUNICATION_PREFERENCES,

        ...preferences,

        // Security notifications remain enabled.
        security: true

    };

}


export function isCommunicationEnabled(
    preferences,
    type
) {

    const normalized =
        normalizeCommunicationPreferences(
            preferences
        );

    return normalized[type] === true;

}