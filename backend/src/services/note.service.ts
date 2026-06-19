import { noteRepository } from '../repositories/index.js';
import type { Note, CreateNoteInput } from '../models/index.js';

export async function createNote(input: CreateNoteInput): Promise<Note> {
    if (!input.messageText.trim()) throw new Error('Message is required.');
    return noteRepository.createNote(input);
}

export async function getAllNotes(): Promise<Note[]> {
    return noteRepository.getAllNotes();
}

export async function getNotesByEmployee(employeeId: number): Promise<Note[]> {
    return noteRepository.getNotesByEmployee(employeeId);
}

export async function markNoteAsRead(noteId: number): Promise<boolean> {
    return noteRepository.markNoteAsRead(noteId);
}
