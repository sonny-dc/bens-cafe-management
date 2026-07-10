import type { Expense, CreateExpenseInput } from './expense.model.js';
import type { PayrollEntry, CreatePayrollEntryInput, PayrollEntryWithEmployeeDetails } from './payroll-entry.model.js';
import type { InventoryBudgetLog } from './inventory-budget-log.model.js';

export interface SalesEntry {
    salesEntryId: number;
    cashSales: string
    onlineCardSales: string;
    physicalCashCount: string | null;
    totalRevenue: string;
    netProfit: string;
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
    payrollEntries: CreatePayrollEntryInput[];
    expenses: CreateExpenseInput[];
}

export interface CreateSalesEntryTransactionResult {
    salesEntry: SalesEntry;
    payrollEntries: PayrollEntry[];
    expenses: Expense[];
}

export interface SalesEntrySummary {
    salesEntry: SalesEntry;
    payrollEntries: PayrollEntryWithEmployeeDetails[];
    expenses: Expense[];
    budgetLog: InventoryBudgetLog;
}
