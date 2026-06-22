import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../../../shared/src/constants/app.constants.js';

export const hashPassword = async (
    password: string
): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
    password: string, 
    hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
