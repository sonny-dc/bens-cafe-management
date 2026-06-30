import type { ShiftStatus } from '../constants/index.js';

export interface ActiveShiftItem {
  id: number;
  employeeId: number;
  name: string;
  role: string;
  clockInTime: string;
}

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

export interface ShiftSummaryItem {
  shiftId: number;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  jobRole: string;

  shiftDate: string;
  startTime: string;
  scheduledEndTime: string | null;
  endTime: string | null;

  openingCash: string;
  closingCash: string;
  recordedCashSales: string | null;
  cashVariance: string | null;

  status: ShiftStatus;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ShiftSession {
  shiftId: number;
  employeeId: number;
  shiftDate: string;
  startTime: string;
  endTime: string | null;
  openingCash: string;
  closingCash: string;
  status: string;
  
}

export interface StaffWeeklyPerformance {
  employeeId: number;
  fullName: string;
  jobRole: string;
  totalCash: string;
  completedShifts: number;
}

export interface StartShiftInput {
    openingCash: string;
}

export interface StartShiftRepositoryInput {
    employeeId: number;
    openingCash: string;
    /**
     * This is handled by the services layer to 
     * ensure the endTime is set to the current 
     * time when ending a shift.
     */
    startTime: string;
}

export interface EndShiftRepositoryInput {
    closingCash: string;
    /**
     * This is handled by the services layer to 
     * ensure the endTime is set to the current 
     * time when ending a shift.
     */
    endTime: string;
}

export interface EndShiftInput {
    closingCash: string;
}

