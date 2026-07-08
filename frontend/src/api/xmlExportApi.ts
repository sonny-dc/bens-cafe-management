import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';

export const downloadSalesXml = async (): Promise<void> => {
  const response = await apiFetch('/export-xml/sales', {
    method: 'GET'
  });

  if (!response.ok) {
    throw await getApiError(response, 'Failed to download XML export.');
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
