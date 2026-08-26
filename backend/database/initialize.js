import { pool } from "./db.js";


export async function initializeDatabase() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS profiles (

            session_id TEXT PRIMARY KEY,

            email TEXT,

            name TEXT,

            created_at
                TIMESTAMPTZ
                DEFAULT NOW(),

            updated_at
                TIMESTAMPTZ
                DEFAULT NOW()

        );


        CREATE TABLE IF NOT EXISTS communication_preferences (

            session_id TEXT PRIMARY KEY

                REFERENCES profiles(session_id)

                ON DELETE CASCADE,

            security
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            important_activity
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            task_complete
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            research_complete
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            learning
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            daily_brief
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            weekly_digest
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            product_update
                BOOLEAN
                NOT NULL
                DEFAULT FALSE,

            updated_at
                TIMESTAMPTZ
                DEFAULT NOW()

        );


        CREATE TABLE IF NOT EXISTS communication_deliveries (

            id
                BIGSERIAL
                PRIMARY KEY,

            session_id
                TEXT
                NOT NULL

                REFERENCES profiles(session_id)

                ON DELETE CASCADE,

            communication_type
                TEXT
                NOT NULL,

            delivery_key
                TEXT
                NOT NULL,

            sent_at
                TIMESTAMPTZ
                DEFAULT NOW(),

            UNIQUE(
                session_id,
                communication_type,
                delivery_key
            )

        );


        /* =====================================================
           AP SYNAPSE PERSONALIZATION
           ===================================================== */


        CREATE TABLE IF NOT EXISTS personalization_profiles (

            identity_id
                TEXT
                PRIMARY KEY,

            email
                TEXT,

            name
                TEXT,

            enabled
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            memory_enabled
                BOOLEAN
                NOT NULL
                DEFAULT TRUE,

            profile_data
                JSONB
                NOT NULL
                DEFAULT '{}'::jsonb,

            created_at
                TIMESTAMPTZ
                DEFAULT NOW(),

            updated_at
                TIMESTAMPTZ
                DEFAULT NOW()

        );


        CREATE TABLE IF NOT EXISTS personalization_memories (

            id
                BIGSERIAL
                PRIMARY KEY,

            identity_id
                TEXT
                NOT NULL

                REFERENCES personalization_profiles(identity_id)

                ON DELETE CASCADE,

            category
                TEXT
                NOT NULL
                DEFAULT 'context',

            content
                TEXT
                NOT NULL,

            content_hash
                TEXT
                NOT NULL,

            importance
                SMALLINT
                NOT NULL
                DEFAULT 5,

            created_at
                TIMESTAMPTZ
                DEFAULT NOW(),

            updated_at
                TIMESTAMPTZ
                DEFAULT NOW(),

            UNIQUE(
                identity_id,
                content_hash
            )

        );


        CREATE TABLE IF NOT EXISTS personalization_turns (

            id
                BIGSERIAL
                PRIMARY KEY,

            identity_id
                TEXT
                NOT NULL

                REFERENCES personalization_profiles(identity_id)

                ON DELETE CASCADE,

            session_id
                TEXT,

            role
                TEXT
                NOT NULL,

            content
                TEXT
                NOT NULL,

            created_at
                TIMESTAMPTZ
                DEFAULT NOW()

        );


        CREATE INDEX IF NOT EXISTS
            idx_personalization_memories_identity

        ON personalization_memories
            (
                identity_id,
                updated_at DESC
            );


        CREATE INDEX IF NOT EXISTS
            idx_personalization_turns_identity

        ON personalization_turns
            (
                identity_id,
                created_at DESC
            );


        CREATE INDEX IF NOT EXISTS
            idx_personalization_memory_search

        ON personalization_memories

        USING GIN
        (
            to_tsvector(
                'simple',
                content
            )
        );


        CREATE INDEX IF NOT EXISTS
            idx_personalization_turn_search

        ON personalization_turns

        USING GIN
        (
            to_tsvector(
                'simple',
                content
            )
        );

    `);


    console.log(
        "AP Synapse PostgreSQL tables initialized."
    );

}
