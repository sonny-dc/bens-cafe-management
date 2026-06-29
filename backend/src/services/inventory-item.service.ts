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

    return inventoryItemRepository.createInventoryItem({
        ...input,
        status
    });
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
): Promise<InventoryItem | null> {
    return inventoryItemRepository.getInventoryItemById(itemId);
}

export async function updateInventoryItem(
    input: UpdateInventoryItemInput
): Promise<InventoryItem | null> {
    const existing = await inventoryItemRepository.getInventoryItemById(input.itemId);

    if (existing === null) {
        return null;
    }

    const stockQuantity = input.stockQuantity ?? existing.stockQuantity;
    const lowThreshold = input.lowThreshold ?? existing.lowThreshold;

    const status = deriveInventoryStatus(stockQuantity, lowThreshold);

    return inventoryItemRepository.updateInventoryItem({
        ...input,
        status
    });
}

export async function deleteInventoryItem(itemId: number): Promise<boolean> {
    return inventoryItemRepository.deleteInventoryItem(itemId);
}
