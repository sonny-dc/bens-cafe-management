// Use ctrl + f to find specific constants or types in this file

// Model constants and types for the application
export const USER_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee'
} as const;

export const ACCOUNT_STATUS = { 
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;

export const EMPLOYMENT_STATUS = { 
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;

export const SHIFT_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
} as const;

export const INVENTORY_STATUS = {
    IN_STOCK: 'in_stock',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock'
} as const;

export const REQUEST_STATUS = {
    PENDING: 'pending',
    ACKNOWLEDGED: 'acknowledged',
    FULFILLED: 'fulfilled'
} as const;

export const EXPENSE_CATEGORIES = {
    UTILITIES: 'utilities',
    RENT: 'rent',
    SUPPLIES: 'supplies',
    MARKETING: 'marketing',
    REPAIRS: 'repairs_maintenance',
    TRANSPORTATION: 'transportation',
    MISCELLANEOUS: 'miscellaneous',
} as const;

export const MESSAGE_TYPES = {
    GENERAL: 'general',
    CONCERN: 'concern',
    URGENT: 'urgent',
    SUGGESTION: 'suggestion',
    MAINTENANCE: 'maintenance',
    FEEDBACK: 'customer_feedback',
    OTHER: 'other'
} as const;

export const MESSAGE_STATUS = {
    NEW: 'new',
    READ: 'read',
    ACKNOWLEDGED: 'acknowledged'
} as const;

// Request Type Definitions
export const REQUEST_TYPES = {
    BODY: 'body',
    QUERY: 'query',
    PARAMS: 'params'
} as const;

// Utils constants

// password-hash.ts
export const SALT_ROUNDS = 12;

// datetime.utils.ts
export const APP_TIME_ZONE = "Asia/Manila";
export const MYSQL_DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
export const MYSQL_DATE_FORMAT = "yyyy-MM-dd";
export const MYSQL_TIME_FORMAT = "HH:mm:ss";


// Type Exports
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];
export type EmploymentStatus = typeof EMPLOYMENT_STATUS[keyof typeof EMPLOYMENT_STATUS];
export type ShiftStatus = typeof SHIFT_STATUS[keyof typeof SHIFT_STATUS];
export type InventoryStatus = typeof INVENTORY_STATUS[keyof typeof INVENTORY_STATUS];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];
export type RequestType = typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES];