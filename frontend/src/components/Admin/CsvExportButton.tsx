import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { downloadSalesCsvFromXml } from '../../api/csvExportApi';

export const CsvExportButton: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await downloadSalesCsvFromXml();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export CSV.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mt-8 flex justify-end">
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg shadow hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
            >
                <FileSpreadsheet size={18} />
                {isExporting ? 'Generating CSV...' : 'Export Sales as CSV'}
            </button>
        </div>
    );
};
