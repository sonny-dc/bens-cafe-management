import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

export async function testConnection() {
  try{      
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("Database connection successful");   
  } catch (err) {
    console.error("Database connection failed: ", err);
    process.exit(1);
  }

}

export default pool;