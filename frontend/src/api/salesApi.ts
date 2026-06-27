import { apiFetch } from './apiFetch';
import type { CreateSalesEntryTransactionInput as CreateSalesEntryPayload } from 'shared/models';

export const salesApi = {
  async createSalesEntryTransaction(payload: CreateSalesEntryPayload) {
    const res = await apiFetch('/sales-entries', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to submit sales entry');
    }
    const json = await res.json();
    return json.data;
  }
};
