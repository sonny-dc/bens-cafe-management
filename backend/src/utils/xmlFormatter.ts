import { create } from 'xmlbuilder2';
import type { SalesEntry } from 'shared/models';

export const formatSalesDataToXml = (salesData: SalesEntry[]): string => {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('SalesExport');

    salesData.forEach((entry) => {
        doc.ele('SalesEntry')
            .ele('Id').txt(entry.salesEntryId.toString()).up()
            .ele('CashSales').txt(entry.cashSales).up()
            .ele('OnlineCardSales').txt(entry.onlineCardSales).up()
            .ele('PhysicalCashCount').txt(entry.physicalCashCount || '').up()
            .ele('TotalRevenue').txt(entry.totalRevenue).up()
            .ele('NetProfit').txt(entry.netProfit).up()
            .ele('UserId').txt(entry.userId ? entry.userId.toString() : '').up()
            .ele('PostedAt').txt(new Date(entry.postedAt).toISOString()).up()
            .ele('CreatedAt').txt(new Date(entry.createdAt).toISOString()).up()
            .up();
    });

    return doc.end({ prettyPrint: true });
};
