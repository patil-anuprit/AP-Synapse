
// ============================================================
// AP_SHARED_CONVERSATION_STORE_V3
// Shared PostgreSQL conversation state with local fallback
// ============================================================

import {
    pool
} from "../database/db.js";


const conversations =
    new Map();

const pendingWrites =
    new Map();

const MAX_HISTORY = 20;

let initializationPromise =
    null;


/* ------------------------------------------------------------
   LOCAL FALLBACK
   ------------------------------------------------------------ */

function getLocalHistory(sessionId) {

    if (
        !conversations.has(
            sessionId
        )
    ) {
        conversations.set(
            sessionId,
            []
        );
    }

    return conversations.get(
        sessionId
    );
}


function addLocalMessage(
    sessionId,
    role,
    content
) {

    const history =
        getLocalHistory(
            sessionId
        );

    history.push({
        role,
        content
    });

    while (
        history.length >
        MAX_HISTORY
    ) {
        history.shift();
    }
}


function queuePendingWrite(
    sessionId,
    role,
    content
) {

    if (
        !pendingWrites.has(
            sessionId
        )
    ) {
        pendingWrites.set(
            sessionId,
            []
        );
    }

    pendingWrites
        .get(sessionId)
        .push({
            role,
            content
        });
}


/* ------------------------------------------------------------
   DATABASE INITIALIZATION
   ------------------------------------------------------------ */

async function ensureConversationTable() {

    if (!initializationPromise) {

        initializationPromise =
            (async () => {

                await pool.query(`
                    CREATE TABLE IF NOT EXISTS
                    ap_conversation_memory (
                        id BIGSERIAL PRIMARY KEY,
                        session_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content JSONB NOT NULL,
                        created_at TIMESTAMPTZ
                            NOT NULL
                            DEFAULT NOW()
                    )
                `);

                await pool.query(`
                    CREATE INDEX IF NOT EXISTS
                    idx_ap_conversation_memory_session
                    ON ap_conversation_memory
                    (session_id, id DESC)
                `);

            })()
            .catch(error => {

                /*
                 * Allow a later request to retry initialization
                 * rather than permanently caching a rejected
                 * initialization promise.
                 */

                initializationPromise =
                    null;

                throw error;
            });
    }

    return initializationPromise;
}


/* ------------------------------------------------------------
   DATABASE HELPERS
   ------------------------------------------------------------ */

async function insertDatabaseMessage(
    sessionId,
    role,
    content
) {

    await pool.query(
        `
        INSERT INTO
            ap_conversation_memory
            (
                session_id,
                role,
                content
            )
        VALUES
            (
                $1,
                $2,
                $3::jsonb
            )
        `,
        [
            sessionId,
            role,
            JSON.stringify(content)
        ]
    );
}


async function pruneDatabaseHistory(
    sessionId
) {

    await pool.query(
        `
        DELETE FROM
            ap_conversation_memory
        WHERE
            session_id = $1
            AND id NOT IN (
                SELECT id
                FROM
                    ap_conversation_memory
                WHERE
                    session_id = $1
                ORDER BY
                    id DESC
                LIMIT $2
            )
        `,
        [
            sessionId,
            MAX_HISTORY
        ]
    );
}


async function flushPendingWrites(
    sessionId
) {

    const pending =
        pendingWrites.get(
            sessionId
        );

    if (
        !Array.isArray(pending) ||
        pending.length === 0
    ) {
        return;
    }

    while (
        pending.length > 0
    ) {

        const item =
            pending[0];

        await insertDatabaseMessage(
            sessionId,
            item.role,
            item.content
        );

        /*
         * Remove only after PostgreSQL confirms the insert.
         */

        pending.shift();
    }

    pendingWrites.delete(
        sessionId
    );

    await pruneDatabaseHistory(
        sessionId
    );
}


/* ------------------------------------------------------------
   PUBLIC STORE API
   ------------------------------------------------------------ */

export async function getConversation(
    sessionId
) {

    const key =
        String(
            sessionId ||
            "default"
        );

    try {

        await ensureConversationTable();

        /*
         * If PostgreSQL was temporarily unavailable,
         * replay locally queued writes before reading.
         */

        await flushPendingWrites(
            key
        );

        const result =
            await pool.query(
                `
                SELECT
                    role,
                    content
                FROM (
                    SELECT
                        id,
                        role,
                        content
                    FROM
                        ap_conversation_memory
                    WHERE
                        session_id = $1
                    ORDER BY
                        id DESC
                    LIMIT $2
                ) recent
                ORDER BY
                    id ASC
                `,
                [
                    key,
                    MAX_HISTORY
                ]
            );

        if (
            Array.isArray(
                result.rows
            ) &&
            result.rows.length > 0
        ) {

            const history =
                result.rows.map(
                    row => ({
                        role:
                            row.role,
                        content:
                            row.content
                    })
                );

            /*
             * Keep local fallback synchronized with
             * the shared PostgreSQL state.
             */

            conversations.set(
                key,
                [...history]
            );

            return [
                ...history
            ];
        }

        /*
         * PostgreSQL has no session yet.
         * Preserve any local emergency history.
         */

        return [
            ...getLocalHistory(
                key
            )
        ];

    }
    catch (error) {

        console.warn(
            "AP Synapse shared memory read unavailable; using local fallback:",
            error.message
        );

        return [
            ...getLocalHistory(
                key
            )
        ];
    }
}


export async function addConversationMessage(
    sessionId,
    role,
    content
) {

    const key =
        String(
            sessionId ||
            "default"
        );

    /*
     * Always retain an immediate local fallback first.
     */

    addLocalMessage(
        key,
        role,
        content
    );

    let inserted =
        false;

    try {

        await ensureConversationTable();

        /*
         * Recover any previous temporary DB outage writes
         * before storing the newest message.
         */

        await flushPendingWrites(
            key
        );

        await insertDatabaseMessage(
            key,
            role,
            content
        );

        inserted =
            true;

        try {

            await pruneDatabaseHistory(
                key
            );

        }
        catch (pruneError) {

            /*
             * Pruning failure must never make a successfully
             * saved conversation message look like a failed write.
             */

            console.warn(
                "AP Synapse conversation pruning warning:",
                pruneError.message
            );
        }

    }
    catch (error) {

        if (!inserted) {

            queuePendingWrite(
                key,
                role,
                content
            );
        }

        console.warn(
            "AP Synapse shared memory write unavailable; local fallback retained:",
            error.message
        );
    }
}


export async function clearConversation(
    sessionId
) {

    const key =
        String(
            sessionId ||
            "default"
        );

    conversations.delete(
        key
    );

    pendingWrites.delete(
        key
    );

    try {

        await ensureConversationTable();

        await pool.query(
            `
            DELETE FROM
                ap_conversation_memory
            WHERE
                session_id = $1
            `,
            [key]
        );

    }
    catch (error) {

        console.warn(
            "AP Synapse shared conversation cleanup warning:",
            error.message
        );
    }
}
