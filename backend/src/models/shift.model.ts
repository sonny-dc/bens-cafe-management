import type { ShiftStatus } from "../config/constants.js";

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
}

export interface EndShiftInput {
    closingCash: string;
}
