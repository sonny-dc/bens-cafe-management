const API_BASE_URL = 'http://localhost:3000/api';

import type { ShiftSession } from 'shared/models';

export const shiftSummaryApi = {
  async getSummary(startDate: string, endDate: string): Promise<ShiftSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/summary?start=${startDate}&end=${endDate}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch shift summary');
      }
      const json = await response.json();
      return json.data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  },

  async archiveWeek(startDate: string, endDate: string): Promise<{ count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/export-clear`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startDate, end: endDate })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive shifts');
      }
      const json = await response.json();
      return { count: json.count };
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }
};
