import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withConnection, withTransaction } from '../config/database.js';
import type { Note, CreateNoteInput, MessageType, MessageStatus } from '../models/index.js';

type MessageRow = RowDataPacket & {
    message_id: number;
    employee_id: number;
    employee_name: string | null;
    message_type: MessageType;
    subject: string | null;
    message_text: string;
    message_status: MessageStatus;
    created_at: Date;
    read_at: Date | null;
    user_id: number | null;
};

function mapRow(row: MessageRow): Note {
    return {
        noteId: row.message_id,
        employeeId: row.employee_id,
        employeeName: row.employee_name ?? undefined,
        messageType: row.message_type,
        subject: row.subject,
        messageText: row.message_text,
        messageStatus: row.message_status,
        createdAt: row.created_at,
        readAt: row.read_at,
        userId: row.user_id,
    };
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO staff_messages (employee_id, message_type, subject, message_text, message_status)
             VALUES (?, ?, ?, ?, 'new')`,
            [input.employeeId, input.messageType, input.subject, input.messageText]
        );

        const [rows] = await connection.query<MessageRow[]>(
            `SELECT sm.*, u.full_name AS employee_name
             FROM staff_messages sm
             LEFT JOIN employee_profiles ep ON ep.employee_id = sm.employee_id
             LEFT JOIN users u ON u.user_id = ep.user_id
             WHERE sm.message_id = ?`,
            [result.insertId]
        );

        const row = rows[0];
        if (!row) throw new Error('Message could not be retrieved after creation.');
        return mapRow(row);
    });
}

export async function getAllNotes(): Promise<Note[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<MessageRow[]>(
            `SELECT sm.*, u.full_name AS employee_name
             FROM staff_messages sm
             LEFT JOIN employee_profiles ep ON ep.employee_id = sm.employee_id
             LEFT JOIN users u ON u.user_id = ep.user_id
             ORDER BY sm.created_at DESC`
        );
        return rows.map(mapRow);
    });
}

export async function getNotesByEmployee(employeeId: number): Promise<Note[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<MessageRow[]>(
            `SELECT sm.*, u.full_name AS employee_name
             FROM staff_messages sm
             LEFT JOIN employee_profiles ep ON ep.employee_id = sm.employee_id
             LEFT JOIN users u ON u.user_id = ep.user_id
             WHERE sm.employee_id = ?
             ORDER BY sm.created_at DESC`,
            [employeeId]
        );
        return rows.map(mapRow);
    });
}

export async function markNoteAsRead(noteId: number): Promise<boolean> {
    return withConnection(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE staff_messages SET message_status = 'read', read_at = CURRENT_TIMESTAMP WHERE message_id = ?`,
            [noteId]
        );
        return result.affectedRows > 0;
    });
}
