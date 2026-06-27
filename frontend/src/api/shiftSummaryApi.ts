import { apiFetch } from "./apiFetch";
import type { ShiftSession } from "shared/models";

export const shiftSummaryApi = {
  async getSummary(startDate: string, endDate: string): Promise<ShiftSession[]> {
    try {
      const response = await apiFetch(`/shifts/summary?start=${startDate}&end=${endDate}`);
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
      const response = await apiFetch(`/shifts/export-clear`, {
        method: 'PATCH',
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
