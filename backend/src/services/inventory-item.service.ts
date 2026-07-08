import { inventoryItemRepository } from '../repositories/index.js';

import {
    INVENTORY_ITEM_STATUS,
    type InventoryItemStatus
} from '../config/constants.js';

import type {
    InventoryItem,
    InventoryItemListItem,
    InventoryItemOption,
    CreateInventoryItemInput,
    UpdateInventoryItemInput
} from '../models/index.js';

import {
    InventoryItemNotFoundError,
    InventoryItemAlreadyExistsError,
    InventoryItemCreationError,
    InventoryItemDeletionError,
    InventoryItemUpdateError
} from '../errors/index.js';

/**
 * Derives the inventory status based on stock quantity and low threshold.
 * @param stockQuantity - The current stock quantity of the inventory item.
 * @param lowThreshold - The low stock threshold for the inventory item.
 * @returns The derived inventory status as an InventoryItemStatus.
 */
function deriveInventoryStatus(
    stockQuantity: string,
    lowThreshold: string
): InventoryItemStatus {
    const stock = Number(stockQuantity);
    const threshold = Number(lowThreshold);

    if (stock === 0) {
        return INVENTORY_ITEM_STATUS.OUT_OF_STOCK;
    }

    if (stock <= threshold) {
        return INVENTORY_ITEM_STATUS.LOW_STOCK;
    }

    return INVENTORY_ITEM_STATUS.IN_STOCK;
}

export async function createInventoryItem(
    input: CreateInventoryItemInput
): Promise<InventoryItem> {
    const status = deriveInventoryStatus(
        input.stockQuantity,
        input.lowThreshold
    );

    const existingItem = await inventoryItemRepository.getInventoryItemByNameCategoryAndUnit({
        itemName: input.itemName,
        category: input.category,
        unit: input.unit
    });

    if (existingItem) {
        throw new InventoryItemAlreadyExistsError('An inventory item with the same name, category, and unit already exists.');
    }

    const inventoryItem = await inventoryItemRepository.createInventoryItem({
        ...input,
        status
    });

    if (!inventoryItem) {
        throw new InventoryItemCreationError();
    }

    return inventoryItem;
}

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
    return inventoryItemRepository.getAllInventoryItems();
}

export async function getInventoryItemList(): Promise<InventoryItemListItem[]> {
    return inventoryItemRepository.getInventoryItemList();
}

export async function getInventoryItemOptions(): Promise<InventoryItemOption[]> {
    return inventoryItemRepository.getInventoryItemOptions();
}

export async function getInventoryItemById(
    itemId: number
): Promise<InventoryItem> {
    const inventoryItem = await inventoryItemRepository.getInventoryItemById(itemId);
    if (!inventoryItem) {
        throw new InventoryItemNotFoundError();
    }
    return inventoryItem;
}

export async function updateInventoryItem(
    input: UpdateInventoryItemInput
): Promise<InventoryItem> {
    const existing = await inventoryItemRepository.getInventoryItemById(input.itemId);

    if (existing === null) {
        throw new InventoryItemNotFoundError();
    }

    const itemName = input.itemName ?? existing.itemName;
    const category = input.category ?? existing.category;
    const unit = input.unit ?? existing.unit;

    const duplicateItem = await inventoryItemRepository.getInventoryItemByNameCategoryAndUnit({
        itemName,
        category,
        unit
    });

    if (duplicateItem && duplicateItem.itemId !== input.itemId) {
        throw new InventoryItemAlreadyExistsError('An inventory item with the same name, category, and unit already exists.');
    }

    const stockQuantity = input.stockQuantity ?? existing.stockQuantity;
    const lowThreshold = input.lowThreshold ?? existing.lowThreshold;

    const status = deriveInventoryStatus(stockQuantity, lowThreshold);

    const updatedItem = await inventoryItemRepository.updateInventoryItem({
        ...input,
        status
    });

    if (!updatedItem) {
        throw new InventoryItemUpdateError();
    }

    return updatedItem;
}

export async function deleteInventoryItem(itemId: number): Promise<boolean> {
    const existing = await inventoryItemRepository.getInventoryItemById(itemId);

    if (existing === null) {
        throw new InventoryItemNotFoundError();
    }
    
    const isDeleted = await inventoryItemRepository.deleteInventoryItem(itemId);
    
    if (!isDeleted) {
        throw new InventoryItemDeletionError();
    }

    return isDeleted;
}
