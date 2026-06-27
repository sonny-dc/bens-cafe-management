import type { Request, Response } from 'express';
import { shiftService } from '../services/index.js';

export async function startShift(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId;

        if (!employeeId) {
            res.status(403).json({
                success: false,
                message: 'Employee profile required.'
            });
            return;
        }

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
        const errorMessage = error instanceof Error ? error.message : "An error occurred while starting the shift.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export async function endShift(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId;
        if (!employeeId) {
            res.status(403).json({
                success: false,
                message: 'Employee profile required.'
            });
            return;
        }

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
        const errorMessage = error instanceof Error ? error.message : "An error occurred while ending the shift.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export async function getMyActiveShift(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = req.session.user?.employeeId;

        if (!employeeId) {
            res.status(403).json({
                success: false,
                message: "Employee profile required."
            });
            return;
        }

        const shift = await shiftService.getActiveShift(employeeId);

        if (!shift) {
            res.status(404).json({
                success: false,
                message: "No active shift found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Active shift retrieved successfully.",
            data: shift
        });
    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "An error occurred while getting the active shift.";

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getActiveShift(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);

        const shift = await shiftService.getActiveShift(employeeId);

        if (!shift) {
            res.status(404).json({
                success: false,
                message: "No active shift found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Active shift retrieved successfully.",
            data: shift
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while getting the active shift.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export async function getAllActiveShifts(_req: Request, res: Response): Promise<void> {
    try {
        const shifts = await shiftService.getAllActiveShifts();
        res.status(200).json({
            success: true,
            message: "All active shifts retrieved successfully.",
            data: shifts
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while getting all active shifts.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export async function getShiftSummary(req: Request, res: Response): Promise<void> {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            res.status(400).json({
                success: false,
                message: "start and end query parameters are required (YYYY-MM-DD)."
            });
            return;
        }

        const shifts = await shiftService.getShiftSummary(String(start), String(end));
        res.status(200).json({
            success: true,
            message: "Shift summary retrieved successfully.",
            data: shifts
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while getting the shift summary.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export async function archiveShifts(req: Request, res: Response): Promise<void> {
    try {
        const { start, end } = req.body;

        if (!start || !end) {
            res.status(400).json({
                success: false,
                message: "start and end body parameters are required (YYYY-MM-DD)."
            });
            return;
        }

        const archivedCount = await shiftService.archiveShifts(String(start), String(end));
        res.status(200).json({
            success: true,
            message: "Shifts archived successfully",
            data: { count: archivedCount }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while archiving shifts.";
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}
