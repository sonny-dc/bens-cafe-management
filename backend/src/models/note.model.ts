export type MessageType = 'general' | 'concern' | 'urgent';
export type MessageStatus = 'new' | 'read' | 'acknowledged';

export interface Note {
    noteId: number;
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

export interface CreateNoteInput {
    employeeId: number;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
}
