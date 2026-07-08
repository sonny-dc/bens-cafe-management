import { shiftRepository } from '../repositories/index.js';
import type { 
    Shift,
    ActiveShiftItem,
    ShiftSummaryItem, 
    StaffWeeklyPerformance, 
    StartShiftInput, 
    EndShiftInput
} from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';
import { SHIFT_STATUS } from '../config/constants.js';

import {
    ShiftNotFoundError,
    ShiftAlreadyCompletedError,
    ShiftUpdateError,
    ShiftAlreadyInProgressError,
    ShiftAccessDeniedError,
    ShiftArchiveError
 } from '../errors/index.js';

export async function startShift(
    employeeId: number, 
    input: StartShiftInput
): Promise<Shift> {
    // Check if the employee already has a shift in progress
    const shiftInProgress = await shiftRepository.getShiftInProgressByEmployee(employeeId);
    if (shiftInProgress) {
        throw new ShiftAlreadyInProgressError();
    }

    // Create new shift
    return shiftRepository.startShift({
        employeeId,
        openingCash: input.openingCash,
        startTime: getCurrentAppDateTime()
    });
}

export async function endShift(
    shiftId: number, 
    employeeId: number, 
    input: EndShiftInput
): Promise<Shift> {
    // Get the shift
    const shift = await shiftRepository.getShiftById(shiftId);

    if (!shift) {
        throw new ShiftNotFoundError();
    }

    if (shift.employeeId !== employeeId) {
        throw new ShiftAccessDeniedError('You are not allowed to end this shift.');
    }

    if (shift.status === SHIFT_STATUS.COMPLETED) {
        throw new ShiftAlreadyCompletedError();
    }


    // Note: cash_variance is calculated by the database dynamically
    // so we just pass the closingCash and end the shift.
    const endedShift = await shiftRepository.endShift(
        shiftId,
        employeeId,
        { 
            closingCash: input.closingCash,
            endTime: getCurrentAppDateTime() 
        }
    );

    if (!endedShift) {
        throw new ShiftUpdateError("Failed to end the shift.");
    }

    return endedShift;
}

export async function getShiftInProgress(employeeId: number): Promise<Shift> {
    const shift = await shiftRepository.getShiftInProgressByEmployee(employeeId);
    if (!shift) {
        throw new ShiftNotFoundError("No active shift found for this employee.");
    }
    return shift;
}

export async function getAllInProgressShifts(): Promise<ActiveShiftItem[]> {
    return shiftRepository.getAllInProgressShifts();
}

export async function getShiftSummary(
    startDate: string,
    endDate: string
): Promise<ShiftSummaryItem[]> {
    return shiftRepository.getShiftSummary(startDate, endDate);
}

export async function getStaffWeeklyPerformance(startDate: string, endDate: string): Promise<StaffWeeklyPerformance[]> {
    return shiftRepository.getStaffWeeklyPerformance(startDate, endDate);
}

export async function archiveShifts(employeeId: number, startDate: string, endDate: string): Promise<number> {
    const affectedRows = await shiftRepository.archiveShiftsByDateRange(employeeId, startDate, endDate);
    if (affectedRows === 0) {
        throw new ShiftArchiveError("No shifts were archived. Please check the provided date range and employee ID.");
    }
    return affectedRows;
}
