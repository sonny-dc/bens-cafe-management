import { AppError } from './app.errors.js';

export class InventoryItemNotFoundError extends AppError {
    constructor(message: string = 'Inventory item not found') {
        super(message, 404);
    }
}

export class InventoryItemAlreadyExistsError extends AppError {
    constructor(message: string = 'Inventory item already exists') {
        super(message, 409);
    }
}

export class InventoryItemCreationError extends AppError {
    constructor(message: string = 'Failed to create inventory item') {
        super(message, 500, false);
    }
}

export class InventoryItemUpdateError extends AppError {
    constructor(message: string = 'Failed to update inventory item') {
        super(message, 500, false);
    }
}

export class InventoryItemDeletionError extends AppError {
    constructor(message: string = 'Failed to delete inventory item') {
        super(message, 500, false);
    }
}

