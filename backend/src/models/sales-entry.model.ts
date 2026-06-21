export interface SalesEntry {
    salesEntryId: number;
    cashSales: string
    onlineCardSales: string;
    physicalCashCount: string | null;
    totalRevenue: string;
    userId: number | null;
    postedAt: Date;
    createdAt: Date;
}

export interface CreateSalesEntryInput {
    cashSales: string;
    onlineCardSales: string;
    physicalCashCount: string | null;
    /**
     * The postedAt is set by the service layer to ensure it
     * uses the current date and time when creating a sales entry.
     */
    postedAt: string;
}