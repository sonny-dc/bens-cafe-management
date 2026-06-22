import type { Request, Response } from 'express';
import { shiftService } from '../services/index.js';

export async function startShift(req: Request, res: Response): Promise<void> {
    try {
        const { employeeId, openingCash } = req.body;

        if (!employeeId || !openingCash) {
            res.status(400).json({ error: "employeeId and openingCash are required." });
            return;
        }

        const shift = await shiftService.startShift({
            employeeId: Number(employeeId),
            openingCash: String(openingCash)
        });

        res.status(201).json({ data: shift });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while starting the shift.";
        res.status(400).json({ error: errorMessage });
    }
}

export async function endShift(req: Request, res: Response): Promise<void> {
    try {
        const shiftId = Number(req.params.shiftId);
        const { closingCash } = req.body;

        if (!shiftId) {
            res.status(400).json({ error: "shiftId is required." });
            return;
        }

        if (!closingCash) {
            res.status(400).json({ error: "closingCash is required." });
            return;
        }

        const shift = await shiftService.endShift(shiftId, {
            closingCash: String(closingCash)
        });

        res.status(200).json({ data: shift });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while ending the shift.";
        res.status(400).json({ error: errorMessage });
    }
}

export async function getActiveShift(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);

        if (!employeeId) {
            res.status(400).json({ error: "employeeId is required." });
            return;
        }

        const shift = await shiftService.getActiveShift(employeeId);

        if (!shift) {
            res.status(404).json({ error: "No active shift found." });
            return;
        }

        res.status(200).json({ data: shift });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred while getting the active shift.";
        res.status(500).json({ error: errorMessage });
    }
}
