import { AppError } from './app.errors.js';

export class RestockCalculationItemNotFoundError extends AppError {
    constructor() {
        super('Restock calculation item not found', 404);
    }
}
