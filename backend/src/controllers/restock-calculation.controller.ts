import type { Request, Response } from 'express';
import { restockCalculationService } from '../services/index.js';

export async function executeRestockCalculation(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const userId = req.session.user?.userId;

        if (!userId) {
            res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
            return;
        }

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
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while executing the restock calculation.';

        const statusCode =
            errorMessage === 'One or more inventory items were not found.'
                ? 404
                : errorMessage === 'Insufficient inventory budget for this restock calculation.'
                    ? 400
                    : 500;

        res.status(statusCode).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getAllRestockCalculations(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const restockCalculations =
            await restockCalculationService.getAllRestockCalculations();

        res.status(200).json({
            success: true,
            message: 'Restock calculations fetched successfully.',
            data: restockCalculations
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching restock calculations.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getRestockCalculationById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const calculationId = Number(req.params.calculationId);

        const restockCalculation =
            await restockCalculationService.getRestockCalculationById(calculationId);

        if (!restockCalculation) {
            res.status(404).json({
                success: false,
                message: 'Restock calculation not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Restock calculation fetched successfully.',
            data: restockCalculation
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching the restock calculation.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
