export interface PayrollEntry {
    payrollEntryId: number;
    salesEntryId: number;
    employeeId: number;
    grossPay: string;
    postedAt: Date;
    createdAt: Date;
}

export interface CreatePayrollEntryInput {
    salesEntryId: number;
    employeeId: number;
    grossPay: string;
    /**
     * The postedAt is set by the service layer to ensure it uses the 
     * current local date and time when creating a payroll entry.
     */
    postedAt: string;
}
