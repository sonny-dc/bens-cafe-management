import { z } from 'zod';
import { positiveInt, nonNegativeDecimalString } from './common.validator.js';

export const shiftIdParamSchema = z.object({
    shiftId: positiveInt
});

export const startShiftSchema = z.object({
    openingCash: nonNegativeDecimalString,
});

export const endShiftSchema = z.object({
    closingCash: nonNegativeDecimalString,
});
