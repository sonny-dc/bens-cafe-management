import { z } from 'zod';

export const decimalString = z
    .string()
    .trim()
    .regex(
        /^\d+(\.\d{1,2})?$/,
        'Must be a valid number with up to 2 decimal places'
    );

export const nonNegativeDecimalString = z
    .string()
    .trim()
    .regex(
        /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        'Must be a valid non-negative number with up to 2 decimal places'
);

export const positiveDecimalStringGreaterThanZero = z
    .string()
    .trim()
    .regex(
        /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        'Must be a positive number with up to 2 decimal places'
    )
    .refine((value) => parseFloat(value) > 0, {
        message: 'Must be greater than zero',
    });

export const nullableDecimalString = z.preprocess(
    (value) => {
        if (value === '' || value === undefined) {
            return null;
        }

        return value;
    },
    decimalString.nullable()
);

export const hourlyRateSchema = z
  .string()
  .trim()
  .min(1, 'Hourly rate must not be empty')
  .regex(
    /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    'Hourly rate must be a valid non-negative amount with up to 2 decimal places'
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

export const yyyyMmDdDate = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must use YYYY-MM-DD format.'
);
