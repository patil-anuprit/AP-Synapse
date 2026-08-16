// ============================================================
// AP SYNAPSE — COMMUNICATION ENGINE
// ============================================================

import {
    sendSecurityNotification,
    sendTaskCompleteNotification,
    sendResearchCompleteNotification,
    sendLearningNotification,
    sendDailyIntelligenceBrief,
    sendWeeklyIntelligenceDigest,
    sendProductUpdate
} from "./emailService.js";


// ============================================================
// COMMUNICATION TYPES
// ============================================================

export const COMMUNICATION_TYPES = Object.freeze({

    SECURITY: "security",

    IMPORTANT_ACTIVITY:
        "important_activity",

    TASK_COMPLETE:
        "task_complete",

    RESEARCH_COMPLETE:
        "research_complete",

    LEARNING:
        "learning",

    DAILY_BRIEF:
        "daily_brief",

    WEEKLY_DIGEST:
        "weekly_digest",

    PRODUCT_UPDATE:
        "product_update"

});


// ============================================================
// DEFAULT PREFERENCES
// ============================================================

export const DEFAULT_COMMUNICATION_PREFERENCES =
    Object.freeze({

        security: true,

        important_activity: true,

        task_complete: true,

        research_complete: true,

        learning: true,

        daily_brief: true,

        weekly_digest: true,

        product_update: false

    });


// ============================================================
// PREFERENCE CHECK
// ============================================================

function isEnabled(
    preferences,
    type
) {

    return (
        preferences?.[type] ??
        DEFAULT_COMMUNICATION_PREFERENCES[type] ??
        false
    );

}


// ============================================================
// MAIN DISPATCHER
// ============================================================

export async function dispatchCommunication({

    type,

    email,

    name,

    preferences =
        DEFAULT_COMMUNICATION_PREFERENCES,

    payload = {}

}) {

    if (!email) {

        throw new Error(
            "Communication recipient email is required."
        );

    }

    // --------------------------------------------------------
    // SECURITY COMMUNICATIONS CANNOT BE DISABLED
    // --------------------------------------------------------

    if (
        type !==
        COMMUNICATION_TYPES.SECURITY &&
        !isEnabled(preferences, type)
    ) {

        console.log(
            `ℹ️ AP Synapse communication skipped: ${type}`
        );

        return {
            sent: false,
            skipped: true,
            reason: "disabled"
        };

    }


    switch (type) {

        // ====================================================
        // SECURITY
        // ====================================================

        case COMMUNICATION_TYPES.SECURITY:

            await sendSecurityNotification({

                email,

                name,

                title:
                    payload.title,

                message:
                    payload.message,

                subject:
                    payload.subject

            });

            break;


        // ====================================================
        // TASK COMPLETE
        // ====================================================

        case COMMUNICATION_TYPES.TASK_COMPLETE:

            await sendTaskCompleteNotification({

                email,

                name,

                taskName:
                    payload.taskName,

                message:
                    payload.message

            });

            break;


        // ====================================================
        // RESEARCH COMPLETE
        // ====================================================

        case COMMUNICATION_TYPES.RESEARCH_COMPLETE:

            await sendResearchCompleteNotification({

                email,

                name,

                researchTitle:
                    payload.researchTitle,

                message:
                    payload.message

            });

            break;


        // ====================================================
        // LEARNING
        // ====================================================

        case COMMUNICATION_TYPES.LEARNING:

            await sendLearningNotification({

                email,

                name,

                subject:
                    payload.subject,

                title:
                    payload.title,

                message:
                    payload.message

            });

            break;


        // ====================================================
        // DAILY BRIEF
        // ====================================================

        case COMMUNICATION_TYPES.DAILY_BRIEF:

            await sendDailyIntelligenceBrief({

                email,

                name,

                highlights:
                    payload.highlights || [],

                nextActions:
                    payload.nextActions || []

            });

            break;


        // ====================================================
        // WEEKLY DIGEST
        // ====================================================

        case COMMUNICATION_TYPES.WEEKLY_DIGEST:

            await sendWeeklyIntelligenceDigest({

                email,

                name,

                summary:
                    payload.summary || "",

                achievements:
                    payload.achievements || [],

                unfinished:
                    payload.unfinished || [],

                recommendations:
                    payload.recommendations || []

            });

            break;


        // ====================================================
        // PRODUCT UPDATE
        // ====================================================

        case COMMUNICATION_TYPES.PRODUCT_UPDATE:

            await sendProductUpdate({

                email,

                name,

                subject:
                    payload.subject,

                title:
                    payload.title,

                message:
                    payload.message

            });

            break;


        // ====================================================
        // UNKNOWN TYPE
        // ====================================================

        default:

            throw new Error(
                `Unsupported AP Synapse communication type: ${type}`
            );

    }


    console.log(
        `📨 AP Synapse communication dispatched: ${type}`
    );


    return {

        sent: true,

        type

    };

}