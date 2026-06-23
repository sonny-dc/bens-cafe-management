import { z } from 'zod';

export const decimalString = z
    .string()
    .trim()
    .regex(
        /^\d+(\.\d{1,2})?$/,
        'Must be a valid number with up to 2 decimal places'
    );

export const nullableDecimalString = z.preprocess(
    (value) => {
        if (value === '' || value === undefined) {
            return null;
        }

        return value;
    },
    decimalString.nullable()
);

export const positiveInt = z.coerce
    .number()
    .int()
    .positive('Must be a positive integer');

export const nullablePositiveInt = z.preprocess(
    (value) => {
        if (value === '' || value === undefined) {
            return null;
        }

        return value;
    },
    positiveInt.nullable()
);