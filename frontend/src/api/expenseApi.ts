import { apiFetch } from './apiFetch';
import type { Expense } from 'shared/models';

export const expenseApi = {
  async getAllExpenses(): Promise<Expense[]> {
    const res = await apiFetch('/expenses');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to fetch expenses');
    }
    const json = await res.json();
    return json.data || [];
  }
};
