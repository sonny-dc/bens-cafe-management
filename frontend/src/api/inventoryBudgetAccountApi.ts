import type { InventoryBudgetAccount } from 'shared/models';

import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

export const inventoryBudgetAccountApi = {
  /**
   * GET /api/inventory-budget-account
   */
  async getCurrent(): Promise<InventoryBudgetAccount | null> {
    const res = await apiFetch('/inventory-budget-accounts');

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory budget account.');
    }

    const json: ApiResponse<InventoryBudgetAccount> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch inventory budget account.');
    }

    return json.data || null;
  }
};
