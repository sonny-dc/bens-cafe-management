const API_BASE_URL = 'http://localhost:3000/api';

import { type MessageType, type MessageStatus, MESSAGE_STATUS } from 'shared/constants';
import type { StaffMessage } from 'shared/models';

export type { MessageType, MessageStatus };
export type Note = StaffMessage;

export const notesApi = {
  async getNotesByEmployee(employeeId: number): Promise<Note[]> {
    const res = await fetch(`${API_BASE_URL}/staff-messages/employee/${employeeId}`);
    if (!res.ok) throw new Error('Could not load your notes. Check your connection.');
    const json = await res.json();
    return json.data;
  },
  
  async getAllNotes(): Promise<Note[]> {
    const res = await fetch(`${API_BASE_URL}/staff-messages`);

    if (!res.ok) {
      throw new Error('Could not load staff notes.');
    }

    const json = await res.json();
    return json.data;
  },

  // General method to update note status, used by specific methods below
  async updateNoteStatus(messageId: number, status: MessageStatus): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/staff-messages/${messageId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error('Could not update note status.');
    }

    const json = await res.json();
    return Boolean(json.data?.success);
  },
  
  // Custom methods for marking notes as acknowledged or read
  async markNoteAsAcknowledged(messageId: number): Promise<boolean> {
    return this.updateNoteStatus(messageId, MESSAGE_STATUS.ACKNOWLEDGED);
  },

  async markNoteAsRead(messageId: number): Promise<boolean> {
    return this.updateNoteStatus(messageId, MESSAGE_STATUS.READ);
  },
  // End of custom methods

  async createNote(payload: {
    employeeId: number;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
  }): Promise<Note> {
    const res = await fetch(`${API_BASE_URL}/staff-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not send your note. Please try again.');
    }
    const json = await res.json();
    return json.data;
  },
};
