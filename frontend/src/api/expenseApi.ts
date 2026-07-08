import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

import type { Expense } from 'shared/models';

export const expenseApi = {
  async getAllExpenses(): Promise<Expense[]> {
    const res = await apiFetch('/expenses');

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch expenses.');
    }

    const json: ApiResponse<Expense[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch expenses.');
    }

    return json.data || [];
  }
};
