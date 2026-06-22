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
