import { z } from 'zod';

const decimalString = z
    .string()
    .regex(
        /^\d+(\.\d{2})?$/,
        "Must be a valid number or decimal with exactly 2 decimal places"
    );

export const salesEntryIdParamSchema = z.object({
    salesEntryId: z.coerce
    .number()
    .int()
    .positive("salesEntryId must be a positive integer")
});

export const createSalesEntrySchema = z.object({
    cashSales: decimalString,
    onlineCardSales: decimalString,
    physicalCashCount: decimalString.optional()
});