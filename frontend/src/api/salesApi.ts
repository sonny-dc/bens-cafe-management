const API_BASE_URL = 'http://localhost:3000/api';

import type { CreateSalesEntryTransactionInput as CreateSalesEntryPayload } from 'shared/models';

export const salesApi = {
  async createSalesEntryTransaction(payload: CreateSalesEntryPayload) {
    const res = await fetch(`${API_BASE_URL}/sales-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to submit sales entry');
    }
    const json = await res.json();
    return json.data;
  }
};
