import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import { parseXmlToCsv } from '../utils/xmlToCsv';

export const downloadSalesCsvFromXml = async (): Promise<void> => {
  const response = await apiFetch('/export-xml/sales', {
    method: 'GET',
  });

  if (!response.ok) {
    throw await getApiError(response, 'Failed to fetch XML export data.');
  }

  const xmlText = await response.text();

  const csvString = parseXmlToCsv(xmlText);

  const blob = new Blob([csvString], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'sales_export.csv';

  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
