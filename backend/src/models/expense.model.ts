import { type ExpenseCategory } from '../config/constants.js';

export interface Expense {
    expenseId: number;
    salesEntryId: number;
    description: string | null;
    amount: string;
    userId: number | null;
    expenseCategory: ExpenseCategory;
    postedAt: Date;
    createdAt: Date;
}

export interface CreateExpenseInput {
    salesEntryId: number;
    description: string | null;
    amount: string;
    userId: number | null;
    expenseCategory: ExpenseCategory;
    /**
     * The postedAt is set by the service layer to ensure
     * it uses the current local date and time when 
     * creating an expense entry.
     */
    postedAt: string;
}