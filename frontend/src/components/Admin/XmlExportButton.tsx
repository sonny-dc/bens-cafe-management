import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadSalesXml } from '../../api/xmlExportApi';

export const XmlExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      await downloadSalesXml();
    } catch (error) {
      if (error instanceof Error) {
        setExportError(error.message);
      } else {
        setExportError('Failed to export XML.');
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
        className="flex items-center gap-2 px-4 py-2 bg-[#5c7155] text-white rounded-lg shadow hover:bg-[#4a5f44] transition-colors disabled:opacity-50"
      >
        <Download size={18} />
        {isExporting ? 'Exporting...' : 'Export Sales as XML'}
      </button>
    </div>
  );
};
