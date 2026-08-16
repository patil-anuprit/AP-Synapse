import { pool } from "../database/db.js";

const DEFAULT_PREFERENCES = {
    security: true,
    important_activity: true,
    task_complete: true,
    research_complete: true,
    learning: true,
    daily_brief: true,
    weekly_digest: true,
    product_update: false
};

export async function getProfile(sessionId) {

    if (!sessionId) {
        throw new Error("sessionId is required.");
    }

    const profileResult = await pool.query(
        `
        INSERT INTO profiles (session_id)
        VALUES ($1)
        ON CONFLICT (session_id)
        DO UPDATE SET updated_at = NOW()
        RETURNING *
        `,
        [sessionId]
    );

    const preferencesResult = await pool.query(
        `
        INSERT INTO communication_preferences (
            session_id
        )
        VALUES ($1)
        ON CONFLICT (session_id)
        DO NOTHING
        RETURNING *
        `,
        [sessionId]
    );

    let preferences;

    if (preferencesResult.rows[0]) {
        preferences = preferencesResult.rows[0];
    } else {
        const existing = await pool.query(
            `
            SELECT *
            FROM communication_preferences
            WHERE session_id = $1
            `,
            [sessionId]
        );

        preferences =
            existing.rows[0] || {
                session_id: sessionId,
                ...DEFAULT_PREFERENCES
            };
    }

    return {
        ...profileResult.rows[0],
        preferences: {
            security: preferences.security,
            important_activity: preferences.important_activity,
            task_complete: preferences.task_complete,
            research_complete: preferences.research_complete,
            learning: preferences.learning,
            daily_brief: preferences.daily_brief,
            weekly_digest: preferences.weekly_digest,
            product_update: preferences.product_update
        }
    };
}

export async function savePreference(
    sessionId,
    key,
    value
) {

    if (!sessionId) {
        throw new Error("sessionId is required.");
    }

    if (!(key in DEFAULT_PREFERENCES)) {
        throw new Error(
            `Unknown communication preference: ${key}`
        );
    }

    const safeValue = Boolean(value);

    await getProfile(sessionId);

    const columnMap = {
        security: "security",
        important_activity: "important_activity",
        task_complete: "task_complete",
        research_complete: "research_complete",
        learning: "learning",
        daily_brief: "daily_brief",
        weekly_digest: "weekly_digest",
        product_update: "product_update"
    };

    const column = columnMap[key];

    await pool.query(
        `
        UPDATE communication_preferences
        SET ${column} = $1,
            updated_at = NOW()
        WHERE session_id = $2
        `,
        [safeValue, sessionId]
    );

    return getProfile(sessionId);
}

export async function forgetPreference(
    sessionId,
    key
) {

    if (!sessionId) {
        throw new Error("sessionId is required.");
    }

    if (!(key in DEFAULT_PREFERENCES)) {
        throw new Error(
            `Unknown communication preference: ${key}`
        );
    }

    await savePreference(
        sessionId,
        key,
        DEFAULT_PREFERENCES[key]
    );

    return getProfile(sessionId);
}
