import type { Request, Response } from 'express';
import { inventoryRequestService } from '../services/index.js';

export async function getAllInventoryRequests(_req: Request, res: Response): Promise<void> {
    try {
        const requests = await inventoryRequestService.getAllInventoryRequests();
        res.status(200).json({ data: requests });
    } catch (error: any) {
        console.error('Error fetching inventory requests:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function getInventoryRequestsByEmployee(req: Request, res: Response): Promise<void> {
    try {
        const employeeId = Number(req.params.employeeId);
        if (!employeeId) {
            res.status(400).json({ error: 'employeeId is required.' });
            return;
        }
        const requests = await inventoryRequestService.getInventoryRequestsByEmployee(employeeId);
        res.status(200).json({ data: requests });
    } catch (error: any) {
        console.error('Error fetching inventory requests by employee:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function createInventoryRequest(req: Request, res: Response): Promise<void> {
    try {
        const { employeeId, itemId, requestedQuantity, requestedUnit, reason } = req.body;
        if (!employeeId || !itemId || !requestedQuantity || !requestedUnit || !reason) {
            res.status(400).json({ error: 'Missing required fields.' });
            return;
        }
        
        const insertId = await inventoryRequestService.createInventoryRequest(
            employeeId, itemId, Number(requestedQuantity), requestedUnit, reason, 'pending'
        );
        
        // Fetch the newly created request so we can return it
        const newRequests = await inventoryRequestService.getInventoryRequestsByEmployee(employeeId);
        const newRequest = newRequests.find((r: any) => r.requestId === insertId);
        
        res.status(201).json({ data: newRequest || { requestId: insertId, success: true } });
    } catch (error: any) {
        console.error('Error creating inventory request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function updateInventoryRequestStatus(req: Request, res: Response): Promise<void> {
    try {
        const requestId = Number(req.params.id);
        const { status } = req.body;
        
        if (!status) {
            res.status(400).json({ error: 'status is required.' });
            return;
        }

        const success = await inventoryRequestService.updateInventoryRequestStatus(requestId, status);
        if (!success) {
            res.status(404).json({ error: 'Inventory request not found.' });
            return;
        }
        res.status(200).json({ data: { success: true } });
    } catch (error: any) {
        console.error('Error updating inventory request status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
