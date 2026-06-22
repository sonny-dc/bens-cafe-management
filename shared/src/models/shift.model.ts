import type { ShiftStatus } from '../constants/index.js';

export interface Shift {
    shiftId: number;
    employeeId: number;
    shiftDate: Date;
    startTime: Date;
    scheduledEndTime: Date | null;
    endTime: Date | null;
    openingCash: string;
    closingCash: string;
    recordedCashSales: string | null;
    cashVariance: string | null;
    status: ShiftStatus;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface StartShiftInput {
    employeeId: number;
    openingCash: string;
    /**
     * This is handled by the services layer to 
     * ensure the endTime is set to the current 
     * time when ending a shift.
     */
    startTime: string;
}

export interface EndShiftInput {
    closingCash: string;
    /**
     * This is handled by the services layer to 
     * ensure the endTime is set to the current 
     * time when ending a shift.
     */
    endTime: string;
}
