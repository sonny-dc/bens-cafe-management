export const parseXmlToCsv = (xmlString: string): string => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
        throw new Error("Error parsing XML data");
    }

    const entries = xmlDoc.getElementsByTagName("SalesEntry");
    if (entries.length === 0) {
        return "No sales data found.\n";
    }

    // Extract headers from the first entry
    const firstEntry = entries[0];
    const headers: string[] = [];
    for (let i = 0; i < firstEntry.children.length; i++) {
        headers.push(firstEntry.children[i].tagName);
    }

    // Build CSV content
    const csvRows: string[] = [];
    csvRows.push(headers.join(","));

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const rowData: string[] = [];
        
        for (let j = 0; j < headers.length; j++) {
            const tagName = headers[j];
            const node = entry.getElementsByTagName(tagName)[0];
            let value = node ? node.textContent || "" : "";
            
            // Escape quotes and wrap in quotes if value contains comma
            if (value.includes(",") || value.includes("\"")) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            rowData.push(value);
        }
        csvRows.push(rowData.join(","));
    }

    return csvRows.join("\n");
};
