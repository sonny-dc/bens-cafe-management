import pool from '../config/database.js';

async function inspectTable() {
    try {
        const connection = await pool.getConnection();
        const [tables]: any = await connection.query(`SHOW TABLES`);
        console.log("--- TABLES ---");
        console.log(tables);
        
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            const [schema] = await connection.query(`DESCRIBE ${tableName}`);
            console.log(`\n--- SCHEMA FOR ${tableName} ---`);
            console.log(JSON.stringify(schema, null, 2));
        }
        connection.release();
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

inspectTable();
