import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

import type { Shift, ActiveShiftItem } from 'shared/models';

export const shiftApi = {
  async getMyActiveShift(): Promise<Shift | null> {
    const response = await apiFetch('/shifts/my-active');

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await getApiError(response, 'Failed to fetch active shift.');
    }

    const json: ApiResponse<Shift> = await response.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch active shift.');
    }

    return json.data;
  },

  async startShift(openingCash: string): Promise<Shift> {
    const response = await apiFetch('/shifts/start', {
      method: 'POST',
      body: JSON.stringify({ openingCash })
    });

    if (!response.ok) {
      throw await getApiError(response, 'Failed to start shift.');
    }

    const json: ApiResponse<Shift> = await response.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to start shift.');
    }

    return json.data;
  },

  async endShift(shiftId: number, closingCash: string): Promise<Shift> {
    const response = await apiFetch(`/shifts/${shiftId}/end`, {
      method: 'POST',
      body: JSON.stringify({ closingCash })
    });

    if (!response.ok) {
      throw await getApiError(response, 'Failed to end shift.');
    }

    const json: ApiResponse<Shift> = await response.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to end shift.');
    }

    return json.data;
  },

  async getAllActiveShifts(): Promise<ActiveShiftItem[]> {
    const response = await apiFetch('/shifts/active/all');

    if (!response.ok) {
      throw await getApiError(response, 'Failed to fetch all active shifts.');
    }

    const json: ApiResponse<ActiveShiftItem[]> = await response.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch all active shifts.');
    }

    return json.data || [];
  }
};
