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
    inventoryBudgetLogRepository,
    employeeRepository

} from "../repositories/index.js";

import { getCurrentAppDateTime } from "../utils/datetime.utils.js";
import { withTransaction } from "../config/database.js";
import {
    
    // General Error
    AppError,

    // Inventory Budget Account Errors
    InventoryBudgetAccountNotFoundError,
    InventoryBudgetAccountUpdateError,

    // Inventory Budget Log Errors
    InventoryBudgetLogCreationError,

    // Sales Entry Errors
    SalesEntryExecutionError,
    SalesEntryCreationError,
    SalesEntryUpdateError,
    SalesEntryNotFoundError,

    // Payroll Entry Errors
    PayrollEntryCreationError,

    // Expense Errors
    ExpenseCreationError,

    // Employee Errors
    EmployeeNotFoundError

 } from "../errors/index.js";

export async function getAllSalesEntries(): Promise<SalesEntry[]> {
    return await salesEntryRepository.getAllSalesEntries();
}

export async function getSalesEntryById(
    salesEntryId: number
): Promise<SalesEntry> {
    const salesEntry = await salesEntryRepository.getSalesEntryById(salesEntryId);
    if (!salesEntry) {
        throw new SalesEntryNotFoundError();
    }
    return salesEntry;
}

export async function createSalesEntryTransaction(
    input: CreateSalesEntryTransactionInput,
    userId: number
): Promise<CreateSalesEntryTransactionResult> {
    try {
        return await withTransaction(async (connection) => {

            const postedAt = getCurrentAppDateTime();

            const employeeIds = [
                ...new Set(input.payrollEntries.map(entry => entry.employeeId))
            ];

            const employees = await employeeRepository.getEmployeesByIdsWithConnection(
                employeeIds,
                connection
            );

            if (employees.length !== employeeIds.length) {
                throw new EmployeeNotFoundError('One or more employees were not found.');
            }

            const salesEntry = await salesEntryRepository.createSalesEntryWithConnection({
                cashSales: input.cashSales,
                onlineCardSales: input.onlineCardSales,
                physicalCashCount: input.physicalCashCount,
                userId: userId,
                postedAt: postedAt
            }, 
            connection
            );
            if (!salesEntry) {
                throw new SalesEntryCreationError();
            }

            const payrollEntries: PayrollEntry[] = [];
            for (const payrollEntryInput of input.payrollEntries) {
                const payrollEntry = await payrollEntryRepository.createPayrollEntryWithConnection({
                    salesEntryId: salesEntry.salesEntryId,
                    employeeId: payrollEntryInput.employeeId,
                    grossPay: payrollEntryInput.grossPay,
                    postedAt: postedAt
                }, connection);
                if (!payrollEntry) {
                    throw new PayrollEntryCreationError();
                }
                payrollEntries.push(payrollEntry);
            }
            
            const expenses: Expense[] = [];

            for (const expenseInput of input.expenses) {
                const expense = await expenseRepository.createExpenseWithConnection({
                    salesEntryId: salesEntry.salesEntryId,
                    description: expenseInput.description,
                    amount: expenseInput.amount,
                    userId: salesEntry.userId,
                    expenseCategory: expenseInput.expenseCategory,
                    postedAt: postedAt
                }, connection);
                if (!expense) {
                    throw new ExpenseCreationError();
                }
                expenses.push(expense);
            }
            
            const totalRevenue = Number(input.cashSales) + Number(input.onlineCardSales);

            const totalPayroll = payrollEntries.reduce((sum, payrollEntry) => sum + Number(payrollEntry.grossPay), 0);

            const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

            const netProfit = totalRevenue - (totalPayroll + totalExpenses);

            const updatedSalesEntry = await salesEntryRepository.updateNetProfitWithConnection(
                salesEntry.salesEntryId,
                netProfit.toFixed(2),
                connection
            );
            if (!updatedSalesEntry) {
                throw new SalesEntryUpdateError();
            }
            const restockingAllotment = netProfit > 0 ? netProfit * 0.5 : 0;

            if (restockingAllotment > 0) {
                const budgetAccount =
                    await inventoryBudgetAccountRepository.getInventoryBudgetAccountForUpdateWithConnection(
                    connection
                    );

                if (budgetAccount === null) {
                    throw new InventoryBudgetAccountNotFoundError();
                }

                const balanceBefore = Number(budgetAccount.currentBalance);
                const balanceAfter = balanceBefore + restockingAllotment;

                const updatedBudgetAccount = await inventoryBudgetAccountRepository.updateInventoryBudgetAccountWithConnection(
                    {
                    budgetAccountId: 1,
                    currentBalance: balanceAfter.toFixed(2)
                    },
                    connection
                );

                if (!updatedBudgetAccount) {
                    throw new InventoryBudgetAccountUpdateError();
                }

                const inventoryBudgetLog = await inventoryBudgetLogRepository.createInventoryBudgetLogWithConnection(
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

                if (!inventoryBudgetLog) {
                    throw new InventoryBudgetLogCreationError();
                }
            }
            
            return {
                salesEntry: updatedSalesEntry,
                payrollEntries,
                expenses
            };
        });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new SalesEntryExecutionError();
    }
}
