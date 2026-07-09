import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { downloadSalesCsvFromXml } from '../../api/csvExportApi';

export const CsvExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      await downloadSalesCsvFromXml();
    } catch (error) {
      if (error instanceof Error) {
        setExportError(error.message);
      } else {
        setExportError('Failed to export CSV.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col items-end gap-2">
      {exportError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {exportError}
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-[#4a6741] text-white rounded-lg shadow hover:bg-[#3a5233] transition-colors disabled:opacity-50 font-medium text-sm"
      >
        <FileSpreadsheet size={18} />
        {isExporting ? 'Generating CSV...' : 'Export as CSV'}
      </button>
    </div>
  );
};
