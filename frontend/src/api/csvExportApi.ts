import { parseXmlToCsv } from '../utils/xmlToCsv';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const downloadSalesCsvFromXml = async (): Promise<void> => {
    // 1. Fetch the XML from the backend
    const response = await fetch(`${API_URL}/export-xml/sales`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch XML export data');
    }

    const xmlText = await response.text();

    // 2. Parse XML into CSV format
    const csvString = parseXmlToCsv(xmlText);

    // 3. Trigger download of the new CSV file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
