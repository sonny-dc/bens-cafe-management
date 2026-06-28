import { z } from 'zod';
import {
  positiveInt,
  nonNegativeDecimalString,
  yyyyMmDdDate
} from './common.validator.js';

export const shiftIdParamSchema = z.object({
    shiftId: positiveInt
});

export const startShiftSchema = z.object({
    openingCash: nonNegativeDecimalString
});

export const endShiftSchema = z.object({
    closingCash: nonNegativeDecimalString
});

const shiftDateRangeSchema = z
    .object({
        start: yyyyMmDdDate,
        end: yyyyMmDdDate
    })
    .refine(
        (data) => new Date(data.start) < new Date(data.end),
        {
        message: 'Start date must be before end date.',
        path: ['end']
        }
    );

export const getStaffWeeklyPerformanceQuerySchema = shiftDateRangeSchema;
