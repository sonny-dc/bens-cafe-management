import type { Request, Response, NextFunction } from 'express';
import { restockCalculationService } from '../services/index.js';

export async function executeRestockCalculation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const result = await restockCalculationService.executeRestockCalculation(
            req.body,
            userId
        );

        res.status(201).json({
            success: true,
            message: 'Restock calculation executed successfully.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllRestockCalculations(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const restockCalculations = await restockCalculationService.getAllRestockCalculations();

        res.status(200).json({
            success: true,
            message: 'Restock calculations fetched successfully.',
            data: restockCalculations
        });
    } catch (error) {
        next(error);
    }
}

export async function getRestockCalculationById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const calculationId = Number(req.params.calculationId);

        const restockCalculation = await restockCalculationService.getRestockCalculationById(calculationId);

        res.status(200).json({
            success: true,
            message: 'Restock calculation fetched successfully.',
            data: restockCalculation
        });
    } catch (error) {
        next(error);
    }
}
