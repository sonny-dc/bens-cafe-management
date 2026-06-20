const API_BASE_URL = 'http://localhost:3000/api';

export type MessageType = 'general' | 'concern' | 'urgent';
export type MessageStatus = 'new' | 'read' | 'acknowledged';

export interface Note {
  noteId: number;
  employeeId: number;
  employeeName?: string;
  messageType: MessageType;
  subject: string | null;
  messageText: string;
  messageStatus: MessageStatus;
  createdAt: string;
  readAt: string | null;
  userId: number | null;
}

export const notesApi = {
  async getNotesByEmployee(employeeId: number): Promise<Note[]> {
    const res = await fetch(`${API_BASE_URL}/notes/employee/${employeeId}`);
    if (!res.ok) throw new Error('Could not load your notes. Check your connection.');
    const json = await res.json();
    return json.data;
  },

  async createNote(payload: {
    employeeId: number;
    messageType: MessageType;
    subject: string | null;
    messageText: string;
  }): Promise<Note> {
    const res = await fetch(`${API_BASE_URL}/notes`, {
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
