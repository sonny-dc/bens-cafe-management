import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';

import type { 
  CreateSalesEntryTransactionInput as CreateSalesEntryPayload,
  CreateSalesEntryTransactionResult,
  SalesEntry
} from 'shared/models';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const salesApi = {
  async getAllSalesEntries(): Promise<SalesEntry[]> {
    const res = await apiFetch('/sales-entries');

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch sales entries.');
    }

    const json: ApiResponse<SalesEntry[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch sales entries.');
    }

    return json.data || [];
  },

  async createSalesEntryTransaction(
    payload: CreateSalesEntryPayload
  ): Promise<CreateSalesEntryTransactionResult> {
    const res = await apiFetch('/sales-entries', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to submit sales entry.');
    }

    const json: ApiResponse<CreateSalesEntryTransactionResult> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to submit sales entry.');
    }

    return json.data;
  }
};
