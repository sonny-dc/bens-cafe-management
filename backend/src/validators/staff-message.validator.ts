import { z } from 'zod';
import { positiveInt } from './common.validator.js';
import { MESSAGE_TYPES, MESSAGE_STATUS } from '../config/constants.js';

export const staffMessageIdParamSchema = z.object({
    messageId: positiveInt
});

export const createStaffMessageSchema = z.object({
    messageType: z.enum(Object.values(MESSAGE_TYPES)),
    subject: z
        .string()
        .trim()
        .max(255)
        .nullable()
        .optional(),
    messageText: z
        .string()
        .trim()
        .min(1, 'Message is required.')
        .max(5000)
});

export const updateStaffMessageStatusSchema = z.object({
    status: z.enum(Object.values(MESSAGE_STATUS))
});

