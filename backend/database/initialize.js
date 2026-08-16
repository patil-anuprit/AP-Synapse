import { pool } from "./db.js";

export async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS profiles (
            session_id TEXT PRIMARY KEY,
            email TEXT,
            name TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS communication_preferences (
            session_id TEXT PRIMARY KEY
                REFERENCES profiles(session_id)
                ON DELETE CASCADE,

            security BOOLEAN NOT NULL DEFAULT TRUE,
            important_activity BOOLEAN NOT NULL DEFAULT TRUE,
            task_complete BOOLEAN NOT NULL DEFAULT TRUE,
            research_complete BOOLEAN NOT NULL DEFAULT TRUE,
            learning BOOLEAN NOT NULL DEFAULT TRUE,
            daily_brief BOOLEAN NOT NULL DEFAULT TRUE,
            weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
            product_update BOOLEAN NOT NULL DEFAULT FALSE,

            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    console.log("? AP Synapse PostgreSQL tables initialized.");
}
