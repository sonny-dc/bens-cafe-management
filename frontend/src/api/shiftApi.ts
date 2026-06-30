import { apiFetch } from './apiFetch';
import type { Shift, ActiveShiftItem } from 'shared/models';

export type { Shift, ActiveShiftItem };

export const shiftApi = {
  async getMyActiveShift(): Promise<Shift | null> {
    const response = await apiFetch('/shifts/my-active');

    if (!response.ok) {
      if (response.status === 404) return null;

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        errorData.error ||
        'Failed to fetch active shift'
      );
    }

    const json = await response.json();
    return json.data;
  },

  async startShift(openingCash: string): Promise<Shift> {
    const response = await apiFetch('/shifts/start', {
      method: 'POST',
      body: JSON.stringify({ openingCash })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        errorData.error ||
        'Failed to start shift'
      );
    }

    const json = await response.json();
    return json.data;
  },

  async endShift(shiftId: number, closingCash: string): Promise<Shift> {
    const response = await apiFetch(`/shifts/${shiftId}/end`, {
      method: 'POST',
      body: JSON.stringify({ closingCash }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        errorData.error ||
        'Failed to end shift'
      );
    }

    const json = await response.json();
    return json.data;
  },

  async getAllActiveShifts(): Promise<ActiveShiftItem[]> {
    const response = await apiFetch('/shifts/active/all');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        errorData.error ||
        'Failed to fetch all active shifts'
      );
    }

    const json = await response.json();
    return json.data;
  }
};
