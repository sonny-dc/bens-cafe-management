import type { Request, Response } from 'express';
import * as noteService from '../services/note.service.js';

export async function createNote(req: Request, res: Response): Promise<void> {
    try {
        const { employeeId, messageType, subject, messageText } = req.body;

        if (!employeeId || !messageText) {
            res.status(400).json({ error: 'employeeId and messageText are required.' });
            return;
        }

        const note = await noteService.createNote({
            employeeId: Number(employeeId),
            messageType: messageType ?? 'general',
            subject: subject ? String(subject) : null,
            messageText: String(messageText),
        });

        res.status(201).json({ data: note });

    } catch (error: any) {
        console.error('Error creating note:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function getAllNotes(_req: Request, res: Response): Promise<void> {
    try {
        const notes = await noteService.getAllNotes();
        res.status(200).json({ data: notes });
    } catch (error: any) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function getNotesByEmployee(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);
        if (!employeeId) {
            res.status(400).json({ error: 'employeeId is required.' });
            return;
        }
        const notes = await noteService.getNotesByEmployee(employeeId);
        res.status(200).json({ data: notes });
    } catch (error: any) {
        console.error('Error fetching notes by employee:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function markNoteAsRead(req: Request, res: Response): Promise<void> {
    try {
        const noteId = Number(req.params.noteId);
        const success = await noteService.markNoteAsRead(noteId);
        if (!success) {
            res.status(404).json({ error: 'Note not found.' });
            return;
        }
        res.status(200).json({ data: { success: true } });
    } catch (error: any) {
        console.error('Error marking note as read:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
