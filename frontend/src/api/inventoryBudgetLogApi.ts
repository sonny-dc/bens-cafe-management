import type { InventoryBudgetLog } from 'shared/models';

import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const inventoryBudgetLogApi = {
  /**
   * GET /api/inventory-budget-logs
   */
  async getAll(): Promise<InventoryBudgetLog[]> {
    const res = await apiFetch('/inventory-budget-logs');

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory budget logs.');
    }

    const json: ApiResponse<InventoryBudgetLog[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch inventory budget logs.');
    }

    return json.data || [];
  },

  /**
   * GET /api/inventory-budget-logs/:budgetLogId
   */
  async getById(budgetLogId: number): Promise<InventoryBudgetLog> {
    const res = await apiFetch(`/inventory-budget-logs/${budgetLogId}`);

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory budget log.');
    }

    const json: ApiResponse<InventoryBudgetLog> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch inventory budget log.');
    }

    return json.data;
  }
};
