import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadSalesXml } from '../../api/xmlExportApi';

export const XmlExportButton: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await downloadSalesXml();
        } catch (error) {
            console.error('Error exporting XML:', error);
            alert('Failed to export XML.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mt-8 flex justify-end">
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
