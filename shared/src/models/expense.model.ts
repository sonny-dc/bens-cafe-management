import { type ExpenseCategory } from '../constants/index.js';

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

export interface CreateExpenseRepositoryInput {
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

/**
 * Used inside the sales entry transaction request body.
 * Backend will add salesEntryId, userId, and postedAt.
*/
export interface CreateExpenseInput {
    description: string | null;
    amount: string;
    expenseCategory: ExpenseCategory;
}

/**
 * Used for representing an expense item in the sales entry form.
 * Contains frontend-only fields like id and isCustom.
 */
export interface ExpenseFormItem {
  formItemId: number;
  expenseCategory: ExpenseCategory;
  amount: string;
  description: string | null;
  isCustom: boolean;
}
