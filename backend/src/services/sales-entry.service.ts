import type { 
    SalesEntry, 
    Expense,
    PayrollEntry,
    CreateSalesEntryTransactionInput, 
    CreateSalesEntryTransactionResult 
} from "../models/index.js";
import { salesEntryRepository, payrollEntryRepository, expenseRepository } from "../repositories/index.js";
import { getCurrentAppDateTime } from "../utils/datetime.utils.js";
import { withTransaction } from "../config/database.js";

export async function getAllSalesEntries(): Promise<SalesEntry[]> {
    return await salesEntryRepository.getAllSalesEntries();
}

export async function getSalesEntryById(
    salesEntryId: number
): Promise<SalesEntry | null> {
    return await salesEntryRepository.getSalesEntryById(salesEntryId);
}

export async function createSalesEntryTransaction(
    input: CreateSalesEntryTransactionInput
): Promise<CreateSalesEntryTransactionResult> {
    return withTransaction(async (connection) => {
        const postedAt = getCurrentAppDateTime();
        const salesEntry = await salesEntryRepository.createSalesEntryWithConnection({
            cashSales: input.cashSales,
            onlineCardSales: input.onlineCardSales,
            physicalCashCount: input.physicalCashCount,
            userId: input.userId,
            postedAt: postedAt
        }, 
        connection
        );
        const payrollEntries: PayrollEntry[] = [];
        for (const payrollEntryInput of input.payrollEntries) {
            const payrollEntry = await payrollEntryRepository.createPayrollEntryWithConnection({
                salesEntryId: salesEntry.salesEntryId,
                employeeId: payrollEntryInput.employeeId,
                grossPay: payrollEntryInput.grossPay,
                postedAt: postedAt
            }, connection);
            payrollEntries.push(payrollEntry);
        }
        
        const expenses: Expense[] = [];

        if (input.expenses !== undefined) {
            for (const expenseInput of input.expenses) {
                const expense = await expenseRepository.createExpenseWithConnection({
                    salesEntryId: salesEntry.salesEntryId,
                    description: expenseInput.description,
                    amount: expenseInput.amount,
                    userId: salesEntry.userId,
                    expenseCategory: expenseInput.expenseCategory,
                    postedAt: postedAt
                }, connection);
                expenses.push(expense);
            }
        }
        
        return {
            salesEntry,
            payrollEntries,
            expenses
        };
    });
    
}

