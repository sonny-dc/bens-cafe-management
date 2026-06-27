import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { dbOptions } from './db-options.js';

const MySQLStore = MySQLStoreFactory(session);

type MySQLStoreOptions = ConstructorParameters<typeof MySQLStore>[0];

const sessionStoreOptions: MySQLStoreOptions & {
  ssl: {
    rejectUnauthorized: boolean;
  };
} = {
  ...dbOptions,

  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 15, // 15 minutes
  expiration: 1000 * 60 * 60 * 8, // 8 hours
};

export const sessionStore: session.Store = new MySQLStore(sessionStoreOptions);