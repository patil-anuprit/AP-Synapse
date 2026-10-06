import { pool } from "../database/db.js";

import {
    dispatchCommunication,
    COMMUNICATION_TYPES
} from "./communicationEngine.js";

/*
 * AP SYNAPSE — WEEKLY INTELLIGENCE NETWORK V2.1
 *
 * - Persists verified Google identities.
 * - Sends one AP Synapse weekly brief per eligible email per ISO week.
 * - Respects communication_preferences.weekly_digest.
 * - Deduplicates across multiple browser sessions.
 * - Failed sends remain retryable.
 */

const BATCH_SIZE = 250;
let tablesReady = false;

function clean(value, max = 320) {
    return String(value || "").trim().slice(0, max);
}

function emailKey(value) {
    return clean(value, 320).toLowerCase();
}

function getIsoWeekKey(date = new Date()) {
    const current = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const day = current.getUTCDay() || 7;
    current.setUTCDate(current.getUTCDate() + 4 - day);

    const yearStart = new Date(Date.UTC(
        current.getUTCFullYear(),
        0,
        1
    ));

    const week = Math.ceil(
        (((current - yearStart) / 86400000) + 1) / 7
    );

    return (
        current.getUTCFullYear() +
        "-W" +
        String(week).padStart(2, "0")
    );
}

async function ensureTables() {
    if (tablesReady) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ap_weekly_intelligence_deliveries (
            recipient_email TEXT NOT NULL,
            week_key TEXT NOT NULL,
            session_id TEXT,
            sent_at TIMESTAMPTZ DEFAULT NOW(),

            PRIMARY KEY (
                recipient_email,
                week_key
            )
        );
    `);

    tablesReady = true;
}

export async function persistVerifiedGoogleAudience({
    sessionId,
    googleId,
    email,
    name
} = {}) {
    const safeEmail = emailKey(email);

    if (!safeEmail) {
        return {
            persisted: false,
            reason: "email_missing"
        };
    }

    const safeGoogleId = clean(googleId, 220);

    const safeSessionId =
        clean(sessionId, 240) ||
        (
            safeGoogleId
                ? `google:${safeGoogleId}`
                : `email:${safeEmail}`
        );

    const safeName =
        clean(name, 180) ||
        "AP Synapse User";

    await pool.query(
        `
        INSERT INTO profiles (
            session_id,
            email,
            name,
            created_at,
            updated_at
        )
        VALUES (
            $1,
            $2,
            $3,
            NOW(),
            NOW()
        )
        ON CONFLICT (session_id)
        DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            updated_at = NOW()
        `,
        [
            safeSessionId,
            safeEmail,
            safeName
        ]
    );

    /*
     * Preserve existing preference choices.
     * New rows inherit the project's existing defaults.
     */
    await pool.query(
        `
        INSERT INTO communication_preferences (
            session_id
        )
        VALUES ($1)
        ON CONFLICT (session_id)
        DO NOTHING
        `,
        [safeSessionId]
    );

    console.log(
        "AP Weekly Intelligence audience persisted:",
        safeEmail
    );

    return {
        persisted: true,
        sessionId: safeSessionId,
        email: safeEmail
    };
}

async function getEligibleRecipients(weekKey) {
    const result = await pool.query(
        `
        WITH canonical AS (
            SELECT DISTINCT ON (
                LOWER(BTRIM(p.email))
            )
                p.session_id,
                LOWER(BTRIM(p.email)) AS email,
                COALESCE(
                    NULLIF(BTRIM(p.name), ''),
                    'AP Synapse User'
                ) AS name,
                p.updated_at
            FROM profiles p
            INNER JOIN communication_preferences cp
                ON cp.session_id = p.session_id
            WHERE
                p.email IS NOT NULL
                AND BTRIM(p.email) <> ''
                AND cp.weekly_digest = TRUE
            ORDER BY
                LOWER(BTRIM(p.email)),
                p.updated_at DESC NULLS LAST,
                p.session_id
        )
        SELECT
            c.session_id,
            c.email,
            c.name
        FROM canonical c
        WHERE NOT EXISTS (
            SELECT 1
            FROM ap_weekly_intelligence_deliveries d
            WHERE
                d.recipient_email = c.email
                AND d.week_key = $1
        )
        ORDER BY c.email
        LIMIT $2
        `,
        [
            weekKey,
            BATCH_SIZE
        ]
    );

    return result.rows || [];
}

function buildWeeklyPayload(name, weekKey) {
    const firstName =
        clean(name, 180)
            .split(/\s+/)
            .filter(Boolean)[0] ||
        "there";

    return {
        title:
            "Your AP Synapse Weekly Intelligence Brief",

        subject:
            `AP Synapse Weekly Intelligence Brief · ${weekKey}`,

        message:
            `Hello ${firstName}. Your AP Synapse weekly intelligence brief is ready — a concise update to help you get more value from your workspace.`,

        highlights: [
            "Continue your highest-priority work from your AP Synapse workspace.",
            "Explore one capability you have not used recently — Aprisha, Canvas, documents, coding, automation or personalization.",
            "Think without limits. Validate with care."
        ],

        nextActions: [
            "Open AP Synapse and continue where you left off.",
            "Try one AP Synapse capability you have not used this week.",
            "Review your communication preferences whenever you want."
        ]
    };
}

async function markDelivered({
    email,
    weekKey,
    sessionId
}) {
    await pool.query(
        `
        INSERT INTO ap_weekly_intelligence_deliveries (
            recipient_email,
            week_key,
            session_id,
            sent_at
        )
        VALUES (
            $1,
            $2,
            $3,
            NOW()
        )
        ON CONFLICT (
            recipient_email,
            week_key
        )
        DO NOTHING
        `,
        [
            emailKey(email),
            weekKey,
            clean(sessionId, 240)
        ]
    );
}

export async function sendWeeklyIntelligenceBriefs() {
    await ensureTables();

    const weekKey = getIsoWeekKey();
    const users = await getEligibleRecipients(weekKey);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
        try {
            const type =
                COMMUNICATION_TYPES?.WEEKLY_DIGEST ||
                "weekly_digest";

            await dispatchCommunication({
                type,
                email: user.email,
                name: user.name,
                sessionId: user.session_id,
                payload: buildWeeklyPayload(
                    user.name,
                    weekKey
                )
            });

            await markDelivered({
                email: user.email,
                weekKey,
                sessionId: user.session_id
            });

            sent += 1;

            console.log(
                "AP Weekly Intelligence sent:",
                user.email,
                weekKey
            );
        }
        catch (error) {
            failed += 1;

            /*
             * No delivery row is written on failure,
             * so the next scheduler cycle can retry.
             */
            console.error(
                "AP Weekly Intelligence send failed:",
                user.email,
                error?.message || error
            );
        }
    }

    return {
        weekKey,
        eligible: users.length,
        sent,
        failed
    };
}


/*
 * AP_WEEKLY_INTELLIGENCE_STATUS_V1
 *
 * Aggregate diagnostics only.
 * No recipient names, emails, session IDs or delivery rows leave
 * the backend.
 */
export async function getWeeklyIntelligenceStatus() {

    await ensureTables();

    const weekKey =
        getIsoWeekKey();

    const result =
        await pool.query(
            `
            WITH
            all_profiles AS (
                SELECT
                    COUNT(*)::int AS total_profiles,
                    COUNT(*) FILTER (
                        WHERE
                            email IS NOT NULL
                            AND BTRIM(email) <> ''
                    )::int AS profiles_with_email
                FROM profiles
            ),

            canonical_with_email AS (
                SELECT DISTINCT
                    LOWER(BTRIM(email)) AS email
                FROM profiles
                WHERE
                    email IS NOT NULL
                    AND BTRIM(email) <> ''
            ),

            canonical_weekly_enabled AS (
                SELECT DISTINCT
                    LOWER(BTRIM(p.email)) AS email
                FROM profiles p
                INNER JOIN communication_preferences cp
                    ON cp.session_id = p.session_id
                WHERE
                    p.email IS NOT NULL
                    AND BTRIM(p.email) <> ''
                    AND cp.weekly_digest = TRUE
            ),

            sent_this_week AS (
                SELECT DISTINCT
                    recipient_email AS email
                FROM ap_weekly_intelligence_deliveries
                WHERE
                    week_key = $1
            )

            SELECT
                ap.total_profiles,
                ap.profiles_with_email,

                (
                    SELECT COUNT(*)::int
                    FROM canonical_with_email
                ) AS unique_email_recipients,

                (
                    SELECT COUNT(*)::int
                    FROM canonical_weekly_enabled
                ) AS weekly_enabled_recipients,

                (
                    SELECT COUNT(*)::int
                    FROM sent_this_week
                ) AS already_sent_this_week,

                (
                    SELECT COUNT(*)::int
                    FROM canonical_weekly_enabled cwe
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM sent_this_week stw
                        WHERE stw.email = cwe.email
                    )
                ) AS eligible_now

            FROM all_profiles ap
            `,
            [
                weekKey
            ]
        );

    const row =
        result.rows?.[0] ||
        {};

    return {
        weekKey,

        totalProfiles:
            Number(
                row.total_profiles ||
                0
            ),

        profilesWithEmail:
            Number(
                row.profiles_with_email ||
                0
            ),

        uniqueEmailRecipients:
            Number(
                row.unique_email_recipients ||
                0
            ),

        weeklyEnabledRecipients:
            Number(
                row.weekly_enabled_recipients ||
                0
            ),

        alreadySentThisWeek:
            Number(
                row.already_sent_this_week ||
                0
            ),

        eligibleNow:
            Number(
                row.eligible_now ||
                0
            )
    };

}
export const AP_WEEKLY_INTELLIGENCE_NETWORK_V21 = {
    version: "2.1.0",
    getIsoWeekKey,
    persistVerifiedGoogleAudience,
    sendWeeklyIntelligenceBriefs,
    getWeeklyIntelligenceStatus
};