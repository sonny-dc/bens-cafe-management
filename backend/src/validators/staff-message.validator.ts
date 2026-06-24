import { z } from 'zod';
import { positiveInt } from './common.validator.js';
import { MESSAGE_TYPES, MESSAGE_STATUS } from '../config/constants.js';

export const staffMessageIdParamSchema = z.object({
    messageId: positiveInt
});

export const createStaffMessageSchema = z.object({
    employeeId: positiveInt,
    messageType: z.enum(Object.values(MESSAGE_TYPES)),
    subject: z
        .string()
        .trim()
        .max(255)
        .optional()
        .nullable()
        .transform((value) => value || null),
    messageText: z.string().trim().min(1, 'Message text cannot be empty')
});

export const updateStaffMessageStatusSchema = z.object({
    status: z.enum(Object.values(MESSAGE_STATUS))
});

