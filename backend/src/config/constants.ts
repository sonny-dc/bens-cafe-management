export const USER_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee'
} as const;

export const ACCOUNT_STATUS = { // used for both user and employee status
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
    URGENT: 'urgent',
    SUGGESTION: 'suggestion',
    MAINTENANCE: 'maintenance',
    FEEDBACK: 'customer_feedback',
    OTHER: 'other'
} as const;

// Type Exports
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];
export type ShiftStatus = typeof SHIFT_STATUS[keyof typeof SHIFT_STATUS];
export type InventoryStatus = typeof INVENTORY_STATUS[keyof typeof INVENTORY_STATUS];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];