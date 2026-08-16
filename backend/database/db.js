import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function testDatabaseConnection() {

    if (!process.env.DATABASE_URL) {
        return {
            connected: false,
            configured: false
        };
    }

    try {

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        return {
            connected: true,
            configured: true,
            currentTime: result.rows[0].current_time
        };

    } catch (error) {

        console.error(
            "AP Synapse database connection failed:",
            error.message
        );

        return {
            connected: false,
            configured: true
        };

    }

}
