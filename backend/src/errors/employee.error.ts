import { AppError } from './app-error.js';

export class EmployeeNotFoundError extends AppError {
    constructor(message = 'Employee not found'){
        super(message, 404);
    }
}

export class EmployeeAlreadyExistsError extends AppError {
    constructor(message = 'Employee already exists'){
        super(message, 409);
    }
}

export class EmployeeStatusError extends AppError {
    constructor(message = 'Employee status operation is not allowed'){
        super(message, 409);
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
