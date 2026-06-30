const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const downloadSalesXml = async (): Promise<void> => {
    const response = await fetch(`${API_URL}/export-xml/sales`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to download XML export');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_export.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
