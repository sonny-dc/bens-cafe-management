import type { Expense, CreateExpenseInput} from './expense.model.js';
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
    /**
     * The postedAt is set by the service layer to ensure it
     * uses the current date and time when creating a sales entry.
     */
    postedAt: string;
}

export interface CreateSalesEntryTransactionInput {
    cashSales: string;
    onlineCardSales: string;
    physicalCashCount: string | null;
    userId: number | null;

    /**
     * The postedAt is set by the service layer to ensure it
     * uses the current date and time when creating a sales entry.
     */
    postedAt: string;

    /**
     * The expenses and payroll entries associated with a sales entry are 
     * created in the same transaction to ensure data consistency.
     */
    payrollEntries: CreatePayrollEntryInput[];
    expenses: CreateExpenseInput[];
    
}

export interface CreateSalesEntryTransactionResult {
    salesEntry: SalesEntry;
    payrollEntries: PayrollEntry[];
    expenses: Expense[];
}