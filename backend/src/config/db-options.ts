import dotenv from 'dotenv';

dotenv.config();

/**
 * Database connection options for MySQL.
 * These options are used to create a connection pool for efficient database access.
 */
export const dbOptions = {
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  ssl: {
    rejectUnauthorized: false // Required for Aiven cloud database SSL
  }
};