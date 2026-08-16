import { pool } from "../database/db.js";

import {
    dispatchCommunication,
    COMMUNICATION_TYPES
} from "./communicationEngine.js";


// ============================================================
// AP SYNAPSE — AUTOMATIC COMMUNICATION SCHEDULER
// ============================================================

const SCHEDULER_INTERVAL =
    5 * 60 * 1000; // check every 5 minutes


function getDailyKey() {

    return new Date()
        .toISOString()
        .slice(0, 10);

}


function getWeeklyKey() {

    const now = new Date();

    const start =
        new Date(
            Date.UTC(
                now.getUTCFullYear(),
                0,
                1
            )
        );

    const days =
        Math.floor(
            (now - start) /
            86400000
        );

    const week =
        Math.ceil(
            (days + start.getUTCDay() + 1) / 7
        );

    return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;

}


// ============================================================
// DELIVERY CHECK
// ============================================================

async function alreadyDelivered(
    sessionId,
    type,
    deliveryKey
) {

    const result =
        await pool.query(
            `
            SELECT id
            FROM communication_deliveries
            WHERE session_id = $1
              AND communication_type = $2
              AND delivery_key = $3
            LIMIT 1
            `,
            [
                sessionId,
                type,
                deliveryKey
            ]
        );

    return Boolean(
        result.rows[0]
    );

}


// ============================================================
// MARK DELIVERY SUCCESSFUL
// ============================================================

async function markDelivered(
    sessionId,
    type,
    deliveryKey
) {

    await pool.query(
        `
        INSERT INTO communication_deliveries
            (
                session_id,
                communication_type,
                delivery_key
            )
        VALUES ($1, $2, $3)
        ON CONFLICT
            (
                session_id,
                communication_type,
                delivery_key
            )
        DO NOTHING
        `,
        [
            sessionId,
            type,
            deliveryKey
        ]
    );

}


// ============================================================
// USERS
// ============================================================

async function getUsers() {

    const result =
        await pool.query(
            `
            SELECT
                p.session_id,
                p.email,
                p.name,

                COALESCE(cp.security, TRUE)
                    AS security,

                COALESCE(cp.important_activity, TRUE)
                    AS important_activity,

                COALESCE(cp.task_complete, TRUE)
                    AS task_complete,

                COALESCE(cp.research_complete, TRUE)
                    AS research_complete,

                COALESCE(cp.learning, TRUE)
                    AS learning,

                COALESCE(cp.daily_brief, TRUE)
                    AS daily_brief,

                COALESCE(cp.weekly_digest, TRUE)
                    AS weekly_digest,

                COALESCE(cp.product_update, FALSE)
                    AS product_update

            FROM profiles p

            LEFT JOIN communication_preferences cp
                ON cp.session_id = p.session_id

            WHERE
                p.email IS NOT NULL
                AND TRIM(p.email) <> ''
            `
        );

    return result.rows;

}


// ============================================================
// DAILY BRIEF
// ============================================================

async function sendDailyBriefs() {

    const deliveryKey =
        getDailyKey();

    const users =
        await getUsers();

    for (const user of users) {

        if (user.daily_brief !== true) {
            continue;
        }

        const delivered =
            await alreadyDelivered(
                user.session_id,
                COMMUNICATION_TYPES.DAILY_BRIEF,
                deliveryKey
            );

        if (delivered) {
            continue;
        }

        try {

            await dispatchCommunication({

                type:
                    COMMUNICATION_TYPES.DAILY_BRIEF,

                email:
                    user.email,

                name:
                    user.name ||
                    "AP Synapse User",

                preferences:
                    user,

                payload: {

                    highlights: [
                        "Your AP Synapse workspace is ready.",
                        "Your intelligence environment is available.",
                        "Your personalized communication system is active."
                    ],

                    nextActions: [
                        "Continue your most important work.",
                        "Review your AP Synapse workspace."
                    ]

                }

            });

            await markDelivered(
                user.session_id,
                COMMUNICATION_TYPES.DAILY_BRIEF,
                deliveryKey
            );

            console.log(
                `✉️ Daily brief sent: ${user.email}`
            );

        }

        catch (error) {

            console.error(
                `Daily brief failed for ${user.email}:`,
                error.message
            );

        }

    }

}


// ============================================================
// WEEKLY DIGEST
// ============================================================

async function sendWeeklyDigests() {

    const deliveryKey =
        getWeeklyKey();

    const users =
        await getUsers();

    for (const user of users) {

        if (user.weekly_digest !== true) {
            continue;
        }

        const delivered =
            await alreadyDelivered(
                user.session_id,
                COMMUNICATION_TYPES.WEEKLY_DIGEST,
                deliveryKey
            );

        if (delivered) {
            continue;
        }

        try {

            await dispatchCommunication({

                type:
                    COMMUNICATION_TYPES.WEEKLY_DIGEST,

                email:
                    user.email,

                name:
                    user.name ||
                    "AP Synapse User",

                preferences:
                    user,

                payload: {

                    summary:
                        "Your AP Synapse weekly intelligence digest is ready.",

                    achievements: [
                        "Your AP Synapse workspace remained available throughout the week."
                    ],

                    unfinished: [],

                    recommendations: [
                        "Review your recent activity.",
                        "Set your most important priorities for the coming week."
                    ]

                }

            });

            await markDelivered(
                user.session_id,
                COMMUNICATION_TYPES.WEEKLY_DIGEST,
                deliveryKey
            );

            console.log(
                `✉️ Weekly digest sent: ${user.email}`
            );

        }

        catch (error) {

            console.error(
                `Weekly digest failed for ${user.email}:`,
                error.message
            );

        }

    }

}


// ============================================================
// SCHEDULER
// ============================================================

export async function runCommunicationScheduler() {

    console.log(
        "⚡ AP Synapse communication scheduler checking..."
    );

    await sendDailyBriefs();

    await sendWeeklyDigests();

}


export function startCommunicationScheduler() {

    console.log(
        "⚡ AP Synapse communication scheduler running..."
    );

    runCommunicationScheduler()
        .catch(error =>
            console.error(
                "Initial communication scheduler error:",
                error
            )
        );

    setInterval(
        () => {

            runCommunicationScheduler()
                .catch(error =>
                    console.error(
                        "Communication scheduler error:",
                        error
                    )
                );

        },
        SCHEDULER_INTERVAL
    );

}