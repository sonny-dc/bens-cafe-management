import type { Request, Response, NextFunction } from 'express';
import { getAllSalesEntries } from '../services/sales-entry.service.js';
import { formatSalesDataToXml } from '../utils/xmlFormatter.js';

export const exportSalesXml = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const salesEntries = await getAllSalesEntries();
        const xmlString = formatSalesDataToXml(salesEntries);

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_export.xml"');
        res.status(200).send(xmlString);
    } catch (error) {
        console.error('Error generating XML export:', error);
        next(error);
    }
};
