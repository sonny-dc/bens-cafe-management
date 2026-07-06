import type { NextFunction, Request, Response } from 'express';
import { shiftService } from '../services/index.js';

export async function startShift(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId!;

        const { openingCash } = req.body;

        const shift = await shiftService.startShift(employeeId, {
            openingCash: String(openingCash)
        });
        res.status(201).json({
            success: true,
            message: 'Shift started successfully.',
            data: shift 
        });
    } catch (error) {
        next(error);
    }
}

export async function endShift(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId!;

        const shiftId = Number(req.params.shiftId);
        const { closingCash } = req.body;

        const shift = await shiftService.endShift(shiftId, employeeId, {
            closingCash: String(closingCash)
        });

        res.status(200).json({
            success: true,
            message: 'Shift ended successfully.',
            data: shift
        });
    } catch (error) {
        next(error);
    }
}

export async function getMyActiveShift(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId!;

        const shift = await shiftService.getShiftInProgress(employeeId);

        res.status(200).json({
            success: true,
            message: "Active shift retrieved successfully.",
            data: shift
        });
    } catch (error) {
        next(error);
    }
}

export async function getActiveShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);

        const shift = await shiftService.getShiftInProgress(employeeId);

        res.status(200).json({
            success: true,
            message: "Active shift retrieved successfully.",
            data: shift
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllActiveShifts(
    _req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const shifts = await shiftService.getAllInProgressShifts();
        res.status(200).json({
            success: true,
            message: "All active shifts retrieved successfully.",
            data: shifts
        });
    } catch (error) {
        next(error);
    }
}

export async function getStaffWeeklyPerformance(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { start, end } = req.query;

        const performance = await shiftService.getStaffWeeklyPerformance(
            String(start), 
            String(end)
        );

        res.status(200).json({
            success: true,
            message: "Staff weekly performance retrieved successfully.",
            data: performance
        });
    } catch (error) {
        next(error);
    }
}


export async function getShiftSummary(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const { start, end } = req.query;

        const shifts = await shiftService.getShiftSummary(String(start), String(end));
        res.status(200).json({
            success: true,
            message: "Shift summary retrieved successfully.",
            data: shifts
        });
    } catch (error) {
        next(error);
    }
}

export async function archiveShifts(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { employeeId, start, end } = req.body;

        const archivedCount = await shiftService.archiveShifts(
            Number(employeeId),
            String(start),
            String(end)
        );

        res.status(200).json({
            success: true,
            message: "Employee shifts archived successfully.",
            data: { count: archivedCount }
        });
    } catch (error) {
        next(error);
    }
}
