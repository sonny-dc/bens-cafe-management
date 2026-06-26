import type { Request, Response } from 'express';
import { inventoryRequestService } from '../services/index.js';

export async function getAllInventoryRequests(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryRequests = await inventoryRequestService.getAllInventoryRequests();
        if (inventoryRequests.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No inventory requests found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory requests retrieved successfully.',
            data: inventoryRequests
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory requests';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getAllInventoryRequestsSimplified(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryRequests = await inventoryRequestService.getAllInventoryRequestsSimplified();
        if (inventoryRequests.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No inventory requests found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory requests retrieved successfully.',
            data: inventoryRequests
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory requests';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryRequestById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const requestId = Number(req.params.requestId);
        const inventoryRequest = await inventoryRequestService.getInventoryRequestById(requestId);
        if (!inventoryRequest) {
            res.status(404).json({
                success: false,
                message: 'Inventory request not found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory request retrieved successfully.',
            data: inventoryRequest
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory request';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryRequestByIdSimplified(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const requestId = Number(req.params.requestId);
        const inventoryRequest = await inventoryRequestService.getInventoryRequestByIdSimplified(requestId);
        if (!inventoryRequest) {
            res.status(404).json({
                success: false,
                message: 'Inventory request not found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory request retrieved successfully.',
            data: inventoryRequest
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory request';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function createInventoryRequest(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryRequest = await inventoryRequestService.createInventoryRequest(req.body);
        if (!inventoryRequest) {
            res.status(400).json({
                success: false,
                message: 'Failed to create inventory request.'
            });
            return;
        }
        res.status(201).json({
            success: true,
            message: 'Inventory request created successfully.',
            data: inventoryRequest
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create inventory request';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function updateInventoryRequestStatus(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const requestId = Number(req.params.requestId);
        const inventoryRequest = await inventoryRequestService.updateInventoryRequestStatus({ ...req.body, requestId });
        if (!inventoryRequest) {
            res.status(404).json({
                success: false,
                message: 'Inventory request not found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory request status updated successfully.',
            data: inventoryRequest
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update inventory request status';
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
    
