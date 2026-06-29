import type { Request, Response } from 'express';
import { inventoryItemService } from '../services/index.js';

export async function createInventoryItem(
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

        const inventoryItem = await inventoryItemService.createInventoryItem({
            ...req.body,
            userId
        });

        if (!inventoryItem) {
            res.status(400).json({
                success: false,
                message: 'Failed to create inventory item.'
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully.',
            data: inventoryItem
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while creating the inventory item.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getAllInventoryItems(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getAllInventoryItems();
        if (!inventoryItems) {
            res.status(404).json({
                success: false,
                message: 'No inventory items found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory items fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching inventory items.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryItemList(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getInventoryItemList();
        if (!inventoryItems) {
            res.status(404).json({
                success: false,
                message: 'No inventory items found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory item list fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching inventory item list.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryItemOptions(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const inventoryItems = await inventoryItemService.getInventoryItemOptions();
        if (!inventoryItems) {
            res.status(404).json({
                success: false,
                message: 'No inventory item options found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Inventory item options fetched successfully.',
            data: inventoryItems
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching inventory item options.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryItemById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const itemId = Number(req.params.itemId);

        const inventoryItem = await inventoryItemService.getInventoryItemById(itemId);

        if (!inventoryItem) {
            res.status(404).json({
                success: false,
                message: 'Inventory item not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item fetched successfully.',
            data: inventoryItem
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching the inventory item.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function updateInventoryItem(
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

        const itemId = Number(req.params.itemId);

        const inventoryItem = await inventoryItemService.updateInventoryItem({
            itemId,
            ...req.body,
            userId
        });

        if (!inventoryItem) {
            res.status(404).json({
                success: false,
                message: 'Inventory item not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully.',
            data: inventoryItem
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while updating the inventory item.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function deleteInventoryItem(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const itemId = Number(req.params.itemId);

        const success = await inventoryItemService.deleteInventoryItem(itemId);

        if (!success) {
            res.status(404).json({
                success: false,
                message: 'Inventory item not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully.',
            data: { success: true }
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while deleting the inventory item.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
