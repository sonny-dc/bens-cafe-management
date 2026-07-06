import { AppError } from './app-errors.js';

export class EmployeeNotFoundError extends AppError {
    constructor(message = 'Employee not found'){
        super(message, 404);
    }
}

export class EmployeeAlreadyActiveError extends AppError {
    constructor(message = 'Employee is already active') {
        super(message, 409);
    }
}

export class EmployeeAlreadyInactiveError extends AppError {
    constructor(message = 'Employee is already inactive') {
        super(message, 409);
    }
}

export class InactiveEmployeeError extends AppError {
    constructor(message = 'This employee is inactive') {
        super(message, 403);
    }
}

export class EmployeeUpdateError extends AppError {
    constructor(message = 'Failed to update employee') {
        super(message, 500, false);
    }
}

export class EmployeeDeletionError extends AppError {
    constructor(message = 'Employee cannot be deleted because they are linked to existing records') {
        super(message, 409);
    }
}
