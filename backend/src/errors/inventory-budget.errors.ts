import { AppError } from './app.errors.js';

// =================================
// Inventory Budget Account Errors
// =================================

export class InventoryBudgetAccountNotFoundError extends AppError {
    constructor(message: string = 'Inventory budget account not found') {
        super(message, 404);
    }
}

export class InventoryBudgetAccountInsufficientBalanceError extends AppError {
    constructor(message: string = 'Insufficient balance in inventory budget account') {
        super(message, 409);
    }
}

export class InventoryBudgetAccountUpdateError extends AppError {
    constructor(message: string = 'Failed to update inventory budget account') {
        super(message, 500, false);
    }
}

// =================================
// Inventory Budget Log Errors
// =================================

export class InventoryBudgetLogNotFoundError extends AppError {
    constructor(message: string = 'Inventory budget log not found') {
        super(message, 404);
    }
}

export class InventoryBudgetLogSourceNotFound extends AppError {
    constructor(message: string = 'Inventory budget log source is invalid or incomplete') {
        super(message, 500, false);
    }
}

export class InventoryBudgetLogCreationError extends AppError {
    constructor(message: string = 'Failed to create inventory budget log') {
        super(message, 500, false);
    }
}


