import type { Request, Response, NextFunction } from 'express';
import { inventoryItemService } from '../services/index.js';

export async function createInventoryItem(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const inventoryItem = await inventoryItemService.createInventoryItem({
            ...req.body,
            userId
        });

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully.',
            data: inventoryItem
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllInventoryItems(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getAllInventoryItems();

        res.status(200).json({
            success: true,
            message: 'Inventory items fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        next(error);
    }
}

export async function getInventoryItemList(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getInventoryItemList();

        res.status(200).json({
            success: true,
            message: 'Inventory item list fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        next(error);
    }
}

export async function getInventoryItemOptions(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getInventoryItemOptions();

        res.status(200).json({
            success: true,
            message: 'Inventory item options fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        next(error);
    }
}

export async function getInventoryItemById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const itemId = Number(req.params.itemId);

        const inventoryItem = await inventoryItemService.getInventoryItemById(itemId);

        res.status(200).json({
            success: true,
            message: 'Inventory item fetched successfully.',
            data: inventoryItem
        });
    } catch (error) {
        next(error);
    }
}

export async function updateInventoryItem(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;

        const itemId = Number(req.params.itemId);

        const inventoryItem = await inventoryItemService.updateInventoryItem({
            itemId,
            ...req.body,
            userId
        });

        res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully.',
            data: inventoryItem
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteInventoryItem(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const itemId = Number(req.params.itemId);

        const success = await inventoryItemService.deleteInventoryItem(itemId);

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully.',
            data: { success: success }
        });
    } catch (error) {
        next(error);
    }
}
