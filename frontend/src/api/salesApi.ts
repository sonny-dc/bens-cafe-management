const API_BASE_URL = 'http://localhost:3000/api';

export interface CreateSalesEntryPayload {
  cashSales: string;
  onlineCardSales: string;
  physicalCashCount: string | null;
  userId: number | null;
  payrollEntries: Array<{
    employeeId: number;
    grossPay: string;
  }>;
  expenses: Array<{
    description: string | null;
    amount: string;
    userId: number | null;
    expenseCategory: string;
  }>;
}

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
