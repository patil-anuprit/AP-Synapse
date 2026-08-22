import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

let tableReady = null;


function ensureTable() {

    if (!tableReady) {

        tableReady = pool.query(`
            CREATE TABLE IF NOT EXISTS ap_live_conversations (
                room_id VARCHAR(64) PRIMARY KEY,
                edit_key_hash CHAR(64) NOT NULL,
                title VARCHAR(180) NOT NULL,
                messages JSONB NOT NULL DEFAULT '[]'::jsonb,
                revision BIGINT NOT NULL DEFAULT 1,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
                    DEFAULT (NOW() + INTERVAL '30 days')
            );

            CREATE INDEX IF NOT EXISTS
                idx_ap_live_conversations_active
            ON ap_live_conversations(active, updated_at);
        `);
    }

    return tableReady;
}


function hashKey(value) {

    return crypto
        .createHash("sha256")
        .update(String(value || ""))
        .digest("hex");
}


function verifyKey(value, storedHash) {

    const supplied =
        Buffer.from(
            hashKey(value),
            "hex"
        );

    const stored =
        Buffer.from(
            String(storedHash || ""),
            "hex"
        );

    if (
        supplied.length !== stored.length ||
        !crypto.timingSafeEqual(
            supplied,
            stored
        )
    ) {

        const error =
            new Error(
                "Invalid live conversation key."
            );

        error.statusCode = 403;

        throw error;
    }
}


function cleanMessage(message) {

    if (
        !message ||
        typeof message !== "object"
    ) {

        return null;
    }


    const role =
        message.role === "assistant"
            ? "assistant"
            : "user";


    const content =
        String(
            message.content || ""
        )
        .slice(0, 50000)
        .trim();


    if (!content) {
        return null;
    }


    const id =
        String(
            message.id ||
            crypto.randomUUID()
        )
        .replace(
            /[^a-zA-Z0-9._:-]/g,
            ""
        )
        .slice(0, 120);


    let createdAt =
        String(
            message.createdAt || ""
        );


    if (
        Number.isNaN(
            Date.parse(createdAt)
        )
    ) {

        createdAt =
            new Date().toISOString();
    }


    return {
        id,
        role,
        content,
        author:
            String(
                message.author ||
                (
                    role === "assistant"
                        ? "AP Synapse"
                        : "Participant"
                )
            )
            .slice(0, 80),

        createdAt
    };
}


function cleanMessages(messages) {

    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .map(cleanMessage)
        .filter(Boolean)
        .slice(-250);
}


function cleanTitle(value) {

    const title =
        String(
            value ||
            "Live AP Synapse Conversation"
        )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

    return (
        title ||
        "Live AP Synapse Conversation"
    );
}


async function getAuthorizedRow(
    client,
    roomId,
    editKey,
    lock = false
) {

    const result =
        await client.query(
            `
            SELECT *
            FROM ap_live_conversations
            WHERE room_id = $1
            ${lock ? "FOR UPDATE" : ""}
            `,
            [
                String(roomId || "")
            ]
        );


    if (!result.rows.length) {

        const error =
            new Error(
                "Live conversation not found."
            );

        error.statusCode = 404;

        throw error;
    }


    const row =
        result.rows[0];


    verifyKey(
        editKey,
        row.edit_key_hash
    );


    if (
        !row.active ||
        new Date(row.expires_at).getTime() <
            Date.now()
    ) {

        const error =
            new Error(
                "This live conversation is no longer active."
            );

        error.statusCode = 410;

        throw error;
    }


    return row;
}


export async function createLiveConversation({
    title,
    messages
}) {

    await ensureTable();


    const roomId =
        crypto
            .randomBytes(12)
            .toString("hex");


    const editKey =
        crypto
            .randomBytes(24)
            .toString("base64url");


    const safeMessages =
        cleanMessages(messages);


    const safeTitle =
        cleanTitle(title);


    await pool.query(
        `
        INSERT INTO ap_live_conversations (
            room_id,
            edit_key_hash,
            title,
            messages,
            revision
        )
        VALUES ($1,$2,$3,$4::jsonb,1)
        `,
        [
            roomId,
            hashKey(editKey),
            safeTitle,
            JSON.stringify(
                safeMessages
            )
        ]
    );


    return {
        roomId,
        editKey,
        title: safeTitle,
        messages: safeMessages,
        revision: 1
    };
}


export async function getLiveConversation(
    roomId,
    editKey
) {

    await ensureTable();


    const row =
        await getAuthorizedRow(
            pool,
            roomId,
            editKey,
            false
        );


    return {
        roomId: row.room_id,
        title: row.title,
        messages:
            Array.isArray(row.messages)
                ? row.messages
                : [],
        revision:
            Number(row.revision || 1),
        updatedAt:
            row.updated_at,
        expiresAt:
            row.expires_at
    };
}


export async function syncLiveConversation(
    roomId,
    editKey,
    incomingMessages
) {

    await ensureTable();


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const row =
            await getAuthorizedRow(
                client,
                roomId,
                editKey,
                true
            );


        const existing =
            Array.isArray(row.messages)
                ? row.messages
                : [];


        const incoming =
            cleanMessages(
                incomingMessages
            );


        const merged =
            existing.map(item => ({
                ...item
            }));


        const positions =
            new Map(
                merged.map(
                    (item, index) =>
                        [
                            item.id,
                            index
                        ]
                )
            );


        for (
            const message of incoming
        ) {

            if (
                positions.has(
                    message.id
                )
            ) {

                const index =
                    positions.get(
                        message.id
                    );


                merged[index] = {
                    ...merged[index],
                    ...message
                };

            } else {

                positions.set(
                    message.id,
                    merged.length
                );

                merged.push(
                    message
                );
            }
        }


        const finalMessages =
            merged.slice(-250);


        const before =
            JSON.stringify(
                existing
            );


        const after =
            JSON.stringify(
                finalMessages
            );


        let revision =
            Number(
                row.revision || 1
            );


        if (
            before !== after
        ) {

            revision += 1;


            await client.query(
                `
                UPDATE ap_live_conversations
                SET
                    messages = $1::jsonb,
                    revision = $2,
                    updated_at = NOW()
                WHERE room_id = $3
                `,
                [
                    after,
                    revision,
                    roomId
                ]
            );
        }


        await client.query(
            "COMMIT"
        );


        return {
            roomId,
            messages:
                finalMessages,
            revision
        };

    } catch (error) {

        try {
            await client.query(
                "ROLLBACK"
            );
        } catch {}

        throw error;

    } finally {

        client.release();
    }
}


export async function stopLiveConversation(
    roomId,
    editKey
) {

    await ensureTable();


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        await getAuthorizedRow(
            client,
            roomId,
            editKey,
            true
        );


        await client.query(
            `
            UPDATE ap_live_conversations
            SET
                active = FALSE,
                updated_at = NOW()
            WHERE room_id = $1
            `,
            [roomId]
        );


        await client.query(
            "COMMIT"
        );


        return {
            success: true
        };

    } catch (error) {

        try {
            await client.query(
                "ROLLBACK"
            );
        } catch {}

        throw error;

    } finally {

        client.release();
    }
}
