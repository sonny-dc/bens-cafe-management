import mysql, {type PoolConnection} from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false // Required for Aiven cloud database SSL
  },
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

/**
 * Borrows a pooled database connection, runs the callback,
 * then always releases the connection back to the pool.
 *
 * Best for simple SELECT queries and independent database operations.
 */
export async function withConnection<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

/**
 * Runs the callback inside a database transaction.
 *
 * Commits if all queries succeed.
 * Rolls back if any query fails.
 * Always releases the connection afterward.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export default pool;