import type { SalesEntry, CreateSalesEntryInput } from "../models/index.js";
import { salesEntryRepository } from "../repositories/index.js";
import { getCurrentAppDateTime } from "../utils/datetime.utils.js";

export async function getAllSalesEntries(): Promise<SalesEntry[]> {
    return await salesEntryRepository.getAllSalesEntries();
}

export async function getSalesEntryById(
    salesEntryId: number
): Promise<SalesEntry | null> {
    return await salesEntryRepository.getSalesEntryById(salesEntryId);
}

export async function createSalesEntry(
    input: CreateSalesEntryInput
): Promise<SalesEntry> {
    return await salesEntryRepository.createSalesEntry({...input, postedAt: getCurrentAppDateTime()});
}

