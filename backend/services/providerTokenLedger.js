import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const WINDOW_MS = 60_000;
const localReservations = new Map();

let sharedPool = null;
let sharedLedgerReady = null;

function databaseUrl() {
    return (
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        ""
    ).trim();
}

function getSharedPool() {
    const connectionString = databaseUrl();

    if (!connectionString) {
        return null;
    }

    if (!sharedPool) {
        sharedPool = new Pool({
            connectionString,
            max: 2,
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 3_000,
            ssl:
                process.env.NODE_ENV === "production"
                    ? { rejectUnauthorized: false }
                    : undefined
        });
    }

    return sharedPool;
}

async function ensureSharedLedger(pool) {
    if (!sharedLedgerReady) {
        sharedLedgerReady = pool.query(`
            CREATE TABLE IF NOT EXISTS ap_provider_token_reservations (
                reservation_id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                tokens INTEGER NOT NULL CHECK (tokens > 0),
                expires_at TIMESTAMPTZ NOT NULL
            )
        `).then(() =>
            pool.query(`
                CREATE INDEX IF NOT EXISTS
                    ap_provider_token_reservations_provider_expiry_idx
                ON ap_provider_token_reservations
                    (provider, expires_at)
            `)
        ).catch(error => {
            sharedLedgerReady = null;
            throw error;
        });
    }

    return sharedLedgerReady;
}

function reserveLocally(
    provider,
    tokens,
    tokenLimit,
    windowMs
) {
    const now = Date.now();
    const reservations =
        localReservations.get(provider) || [];

    const active = reservations.filter(
        reservation => reservation.expiresAt > now
    );

    const used = active.reduce(
        (sum, reservation) =>
            sum + reservation.tokens,
        0
    );

    if (used + tokens > tokenLimit) {
        localReservations.set(provider, active);

        return {
            admitted: false,
            source: "local",
            used,
            retryAfterMs:
                active.length > 0
                    ? Math.max(
                        1,
                        Math.min(
                            ...active.map(
                                reservation =>
                                    reservation.expiresAt - now
                            )
                        )
                    )
                    : windowMs
        };
    }

    active.push({
        tokens,
        expiresAt: now + windowMs
    });

    localReservations.set(provider, active);

    return {
        admitted: true,
        source: "local",
        used: used + tokens,
        retryAfterMs: 0
    };
}

async function reserveInPostgres(
    pool,
    provider,
    tokens,
    tokenLimit,
    windowMs
) {
    await ensureSharedLedger(pool);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [`ap-provider-token-ledger:${provider}`]
        );

        await client.query(
            `DELETE FROM ap_provider_token_reservations
             WHERE expires_at <= NOW()`
        );

        const usageResult = await client.query(
            `SELECT COALESCE(SUM(tokens), 0)::bigint AS used,
                    MIN(expires_at) AS next_expiry
             FROM ap_provider_token_reservations
             WHERE provider = $1
               AND expires_at > NOW()`,
            [provider]
        );

        const used = Number(
            usageResult.rows[0]?.used || 0
        );

        if (used + tokens > tokenLimit) {
            await client.query("ROLLBACK");

            const nextExpiry =
                usageResult.rows[0]?.next_expiry;

            return {
                admitted: false,
                source: "postgres",
                used,
                retryAfterMs: nextExpiry
                    ? Math.max(
                        1,
                        new Date(nextExpiry).getTime() -
                            Date.now()
                    )
                    : windowMs
            };
        }

        await client.query(
            `INSERT INTO ap_provider_token_reservations
                (reservation_id, provider, tokens, expires_at)
             VALUES
                ($1, $2, $3,
                 NOW() +
                    ($4::double precision *
                     INTERVAL '1 millisecond'))`,
            [
                randomUUID(),
                provider,
                tokens,
                windowMs
            ]
        );

        await client.query("COMMIT");

        return {
            admitted: true,
            source: "postgres",
            used: used + tokens,
            retryAfterMs: 0
        };
    }
    catch (error) {
        try {
            await client.query("ROLLBACK");
        }
        catch {}

        throw error;
    }
    finally {
        client.release();
    }
}

export async function reserveProviderTokens({
    provider,
    tokens,
    tokenLimit,
    windowMs = WINDOW_MS
}) {
    if (!provider || typeof provider !== "string") {
        throw new TypeError("provider is required.");
    }

    if (
        !Number.isInteger(tokens) ||
        tokens <= 0 ||
        !Number.isInteger(tokenLimit) ||
        tokenLimit <= 0
    ) {
        throw new TypeError(
            "tokens and tokenLimit must be positive integers."
        );
    }

    if (tokens > tokenLimit) {
        return {
            admitted: false,
            source: "preflight",
            used: 0,
            retryAfterMs: windowMs
        };
    }

    const pool = getSharedPool();

    if (!pool) {
        return reserveLocally(
            provider,
            tokens,
            tokenLimit,
            windowMs
        );
    }

    try {
        return await reserveInPostgres(
            pool,
            provider,
            tokens,
            tokenLimit,
            windowMs
        );
    }
    catch {
        // When a shared database is configured, silently falling back to
        // per-process accounting could let two servers oversubscribe the
        // same organization limit. Deny Groq and let the router fail over.
        return {
            admitted: false,
            source: "shared-ledger-unavailable",
            used: 0,
            retryAfterMs: windowMs
        };
    }
}

export function resetLocalProviderTokenLedgerForTests() {
    localReservations.clear();
}
