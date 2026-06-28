import { z } from 'zod';
import { positiveInt, nonNegativeDecimalString } from './common.validator.js';
import { REQUEST_STATUS } from '../config/constants.js'; 

export const inventoryRequestIdParamSchema = z.object({
    requestId: positiveInt
});

export const createInventoryRequestSchema = z.object({
    itemId: positiveInt,
    requestedQuantity: nonNegativeDecimalString,
    requestedUnit: z.string().trim().min(1, 'requestedUnit must not be empty').max(20, 'requestedUnit must not exceed 20 characters'),
    reason: z.string().trim().min(1, 'reason must not be empty').max(255, 'reason must not exceed 255 characters'),
    userId: positiveInt.optional()
});

export const updateInventoryRequestStatusSchema = z.object({
    requestStatus: z.enum(Object.values(REQUEST_STATUS))
});
