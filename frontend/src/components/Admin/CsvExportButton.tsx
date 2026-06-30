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
                className="flex items-center gap-2 px-4 py-2 bg-[#4a6741] text-white rounded-lg shadow hover:bg-[#3a5233] transition-colors disabled:opacity-50 font-medium text-sm"
            >
                <FileSpreadsheet size={18} />
                {isExporting ? 'Generating CSV...' : 'Export as CSV'}
            </button>
        </div>
    );
};
