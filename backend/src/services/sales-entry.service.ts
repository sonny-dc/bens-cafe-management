import type { 
    SalesEntry, 
    Expense,
    PayrollEntry,
    CreateSalesEntryTransactionInput, 
    CreateSalesEntryTransactionResult 
} from "../models/index.js";

import {
    INVENTORY_BUDGET_TRANSACTION_TYPES,
    INVENTORY_BUDGET_SOURCE_TYPES
} from "../config/constants.js";

import {
    salesEntryRepository, 
    payrollEntryRepository, 
    expenseRepository,
    inventoryBudgetAccountRepository,
    inventoryBudgetLogRepository

} from "../repositories/index.js";

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
        const totalRevenue =
        Number(input.cashSales) + Number(input.onlineCardSales);

        const totalPayroll = payrollEntries.reduce(
        (sum, payrollEntry) => sum + Number(payrollEntry.grossPay),
        0
        );

        const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
        );

        const netProfit = totalRevenue - (totalPayroll + totalExpenses);

        const updatedSalesEntry = await salesEntryRepository.updateNetProfitWithConnection(
            salesEntry.salesEntryId,
            netProfit.toFixed(2),
            connection
        );
        const restockingAllotment = netProfit > 0 ? netProfit * 0.5 : 0;

        if (restockingAllotment > 0) {
            const budgetAccount =
                await inventoryBudgetAccountRepository.getInventoryBudgetAccountForUpdateWithConnection(
                connection
                );

            if (budgetAccount === null) {
                throw new Error('Inventory budget account was not found.');
            }

            const balanceBefore = Number(budgetAccount.currentBalance);
            const balanceAfter = balanceBefore + restockingAllotment;

            await inventoryBudgetAccountRepository.updateInventoryBudgetAccountWithConnection(
                {
                budgetAccountId: 1,
                currentBalance: balanceAfter.toFixed(2)
                },
                connection
            );

            await inventoryBudgetLogRepository.createInventoryBudgetLogWithConnection(
                {
                budgetAccountId: 1,
                transactionType: INVENTORY_BUDGET_TRANSACTION_TYPES.IN,
                amount: restockingAllotment.toFixed(2),
                sourceType: INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY,
                salesEntryId: salesEntry.salesEntryId,
                restockCalculationId: null,
                balanceBefore: balanceBefore.toFixed(2),
                balanceAfter: balanceAfter.toFixed(2),
                userId: salesEntry.userId,
                postedAt
                },
                connection
            );
        }
        
        return {
            salesEntry: updatedSalesEntry,
            payrollEntries,
            expenses
        };
    });
    
}

