import { apiFetch } from "./apiFetch";
import { getApiError } from "./apiError";
import type { ApiResponse } from "./apiResponse";

import type {
  StaffWeeklyPerformance,
  ShiftSummaryItem
} from "shared/models";

export const shiftSummaryApi = {
  async getSummary(
    startDate: string,
    endDate: string
  ): Promise<ShiftSummaryItem[]> {
    const response = await apiFetch(
      `/shifts/summary?start=${startDate}&end=${endDate}`
    );

    if (!response.ok) {
      throw await getApiError(response, 'Failed to fetch shift summary.');
    }

    const json: ApiResponse<ShiftSummaryItem[]> = await response.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch shift summary.');
    }

    return json.data || [];
  },

  async getStaffWeeklyPerformance(
    startDate: string,
    endDate: string
  ): Promise<StaffWeeklyPerformance[]> {
    const response = await apiFetch(
      `/shifts/staff-performance?start=${startDate}&end=${endDate}`
    );

    if (!response.ok) {
      throw await getApiError(
        response,
        'Failed to fetch staff weekly performance.'
      );
    }

    const json: ApiResponse<StaffWeeklyPerformance[]> = await response.json();

    if (!json.success) {
      throw new Error(
        json.message || 'Failed to fetch staff weekly performance.'
      );
    }

    return json.data || [];
  },

  async archiveWeek(
    employeeId: number,
    startDate: string,
    endDate: string
  ): Promise<{ count: number }> {
    const response = await apiFetch('/shifts/export-clear', {
      method: 'PATCH',
      body: JSON.stringify({
        employeeId,
        start: startDate,
        end: endDate
      })
    });

    if (!response.ok) {
      throw await getApiError(response, 'Failed to archive shifts.');
    }

    const json: ApiResponse<{ count: number }> = await response.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to archive shifts.');
    }

    return json.data;
  }
};
