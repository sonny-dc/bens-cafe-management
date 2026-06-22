const API_BASE_URL = "http://localhost:3000/api"; // Replace with your actual backend port

import type { Shift } from 'shared/models';

export type { Shift };

export const shiftApi = {
  async getActiveShift(employeeId: number): Promise<Shift | null> {
    const response = await fetch(`${API_BASE_URL}/shifts/active/${employeeId}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active shift');
    }
    const json = await response.json();
    return json.data;
  },

  async startShift(employeeId: number, openingCash: string): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/shifts/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, openingCash }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start shift');
    }

    const json = await response.json();
    return json.data;
  },

  async endShift(shiftId: number, closingCash: string): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ closingCash }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to end shift');
    }

    const json = await response.json();
    return json.data;
  }
};
