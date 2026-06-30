import { apiFetch } from "./apiFetch";
import type { StaffWeeklyPerformance, ShiftSummaryItem } from "shared/models";

export const shiftSummaryApi = {
  async getSummary(startDate: string, endDate: string): Promise<ShiftSummaryItem[]> {
    try {
      const response = await apiFetch(`/shifts/summary?start=${startDate}&end=${endDate}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch shift summary');
      }
      const json = await response.json();
      return json.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  async getStaffWeeklyPerformance(startDate: string, endDate: string): Promise<StaffWeeklyPerformance[]> {
    try {
      const response = await apiFetch(`/shifts/staff-performance?start=${startDate}&end=${endDate}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message ||
          error.error ||
          'Failed to fetch staff weekly performance');
      }
      const json = await response.json();
      return json.data || [];
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  async archiveWeek(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<{ count: number }> {
    try {
      const response = await apiFetch('/shifts/export-clear', {
        method: 'PATCH',
        body: JSON.stringify({
          employeeId,
          start: startDate,
          end: endDate
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message ||
          error.error ||
          'Failed to archive shifts'
        );
      }

      const json = await response.json();
      return json.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
};
