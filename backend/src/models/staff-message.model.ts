import type { MessageStatus, MessageType } from '../config/constants.js';

export interface StaffMessage {
    messageId: number;
    employeeId: number;
    employeeName?: string | undefined;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
    messageStatus: MessageStatus;
    createdAt: Date;
    readAt: Date | null;
    userId: number | null;
}

export interface CreateStaffMessageInput {
    employeeId: number;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
}
