import type { Expense, CreateExpenseInput } from './expense.model.js';
import type { PayrollEntry, CreatePayrollEntryInput } from './payroll-entry.model.js';

export interface SalesEntry {
    salesEntryId: number;
    cashSales: string
    onlineCardSales: string;
    physicalCashCount: string | null;
    totalRevenue: string;
    userId: number | null;
    postedAt: Date;
    createdAt: Date;
}

export interface CreateSalesEntryInput {
    cashSales: string;
    onlineCardSales: string;
    physicalCashCount: string | null;
    userId: number | null;
    postedAt: string;
}

export interface CreateSalesEntryTransactionInput {
    cashSales: string;
    onlineCardSales: string;
    physicalCashCount: string | null;
    userId: number | null;
    postedAt: string;
    payrollEntries: CreatePayrollEntryInput[];
    expenses: CreateExpenseInput[];
}

export interface CreateSalesEntryTransactionResult {
    salesEntry: SalesEntry;
    payrollEntries: PayrollEntry[];
    expenses: Expense[];
}