import pool from '../config/database.js';

async function inspectTable() {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(`DESCRIBE shift_sessions`);
        console.log(JSON.stringify(rows, null, 2));
        connection.release();
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

inspectTable();
