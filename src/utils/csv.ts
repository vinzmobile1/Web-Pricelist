import Papa from 'papaparse';

function parseCellValue(val: string): any {
  if (val === null || val === undefined) return '';
  const trimmed = String(val).trim();
  if (trimmed === '') return '';

  if (trimmed === '0') return 0;
  if (trimmed.startsWith('0') && trimmed.length > 1 && !trimmed.startsWith('0,')) {
    return trimmed; 
  }

  if (trimmed.endsWith('%')) {
    const numPart = trimmed.slice(0, -1).trim();
    if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(numPart) || /^-?\d+(,\d+)?$/.test(numPart)) {
       const cleaned = numPart.replace(/\./g, '').replace(/,/g, '.');
       const num = parseFloat(cleaned);
       if (!isNaN(num)) return num / 100;
    }
  }

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
    const cleaned = trimmed.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }

  if (/^-?\d+,\d+$/.test(trimmed)) {
    const cleaned = trimmed.replace(/,/g, '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
  }

  return trimmed;
}

export const fetchAndParseCSV = async (sheetId: string, sheetName: string) => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch CSV data');
  }
  
  const csvText = await response.text();
  
  return new Promise<any[]>((resolve, reject) => {
    Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
            console.warn('CSV parsing errors:', results.errors);
        }
        
        const rows = results.data;
        if (rows.length === 0) {
          resolve([]);
          return;
        }

        // Use the first row as headers and clean them
        const rawHeaders = rows[0];
        const headers = rawHeaders.map((header, index) => {
          let cleanHeader = header ? String(header).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
          if (!cleanHeader) {
            cleanHeader = `Column ${index + 1}`;
          }
          return cleanHeader;
        });

        // Ensure headers are unique
        const uniqueHeaders: string[] = [];
        const headerCounts: Record<string, number> = {};
        
        headers.forEach(header => {
          if (headerCounts[header] !== undefined) {
            headerCounts[header]++;
            uniqueHeaders.push(`${header} (${headerCounts[header]})`);
          } else {
            headerCounts[header] = 0;
            uniqueHeaders.push(header);
          }
        });

        // Map remaining rows to objects using the unique headers
        const data = rows.slice(1).map(row => {
          const obj: Record<string, any> = {};
          uniqueHeaders.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? parseCellValue(row[index]) : '';
          });
          return obj;
        });

        resolve(data);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};
