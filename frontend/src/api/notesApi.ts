import {
  type MessageType,
  type MessageStatus,
  MESSAGE_STATUS
} from 'shared/constants';

import type { StaffMessage } from 'shared/models';

import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

export type { MessageType, MessageStatus };
export type Note = StaffMessage;

export const notesApi = {
  async getMyNotes(): Promise<Note[]> {
    const res = await apiFetch('/staff-messages/my');

    if (!res.ok) {
      throw await getApiError(res, 'Could not load your notes.');
    }

    const json: ApiResponse<Note[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Could not load your notes.');
    }

    return json.data || [];
  },

  async getNotesByEmployee(employeeId: number): Promise<Note[]> {
    const res = await apiFetch(`/staff-messages/employee/${employeeId}`);

    if (!res.ok) {
      throw await getApiError(res, 'Could not load staff notes.');
    }

    const json: ApiResponse<Note[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Could not load staff notes.');
    }

    return json.data || [];
  },

  async getAllNotes(): Promise<Note[]> {
    const res = await apiFetch('/staff-messages');

    if (!res.ok) {
      throw await getApiError(res, 'Could not load staff notes.');
    }

    const json: ApiResponse<Note[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Could not load staff notes.');
    }

    return json.data || [];
  },

  async updateNoteStatus(
    messageId: number,
    status: MessageStatus
  ): Promise<boolean> {
    const res = await apiFetch(`/staff-messages/${messageId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Could not update note status.');
    }

    const json: ApiResponse<{ success: boolean }> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Could not update note status.');
    }

    return Boolean(json.data.success);
  },

  async markNoteAsAcknowledged(messageId: number): Promise<boolean> {
    return this.updateNoteStatus(messageId, MESSAGE_STATUS.ACKNOWLEDGED);
  },

  async markNoteAsRead(messageId: number): Promise<boolean> {
    return this.updateNoteStatus(messageId, MESSAGE_STATUS.READ);
  },

  async createNote(payload: {
    messageType: MessageType;
    subject: string | null;
    messageText: string;
  }): Promise<Note> {
    const res = await apiFetch('/staff-messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Could not send your note. Please try again.');
    }

    const json: ApiResponse<Note> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Could not send your note. Please try again.');
    }

    return json.data;
  },
};
