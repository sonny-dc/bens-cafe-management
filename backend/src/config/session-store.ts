import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import pool from './database.js';

const MySQLStore = MySQLStoreFactory(session);

const sessionStoreOptions = {
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 15, // 15 minutes
  expiration: 1000 * 60 * 60 * 8 // 8 hours
};

export const sessionStore: session.Store = new MySQLStore(
  sessionStoreOptions,
  pool as any
);