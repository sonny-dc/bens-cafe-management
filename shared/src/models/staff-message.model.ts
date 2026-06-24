import type { MessageStatus, MessageType } from '../constants/index.js';

export interface StaffMessage {
    messageId: number;
    employeeId: number;
    employeeName?: string | undefined;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
    messageStatus: MessageStatus;
    postedAt: Date;
    createdAt: Date;
    readAt: Date | null;
    userId: number | null;
}

export interface CreateStaffMessageInput {
    employeeId: number;
    messageType: MessageType;
    /**
     * The postedAt is set by the service layer to ensure it 
     * uses the current date and time when creating a message.
     */
    postedAt: string;
    subject: string | null;
    messageText: string;
}

export interface UpdateStaffMessageStatusInput {
    messageId: number;
    status: MessageStatus;
    readAt: string;
}
