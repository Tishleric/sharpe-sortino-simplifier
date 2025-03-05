
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export type ParsedData = {
  headers: string[];
  rows: (string | number)[][];
  originalData: any[];
};

export const supportedFileTypes = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/tab-separated-values',
];

export const parseFile = async (file: File): Promise<ParsedData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // Ensure we have data
    if (!rawData || !rawData.length) {
      toast.error('No data found in the file');
      return null;
    }
    
    // Extract headers (first row)
    const headers = (rawData[0] as any[]).map(h => String(h || `Column ${h + 1}`));
    
    // Extract data rows
    const rows = rawData.slice(1) as (string | number)[][];
    
    return {
      headers,
      rows,
      originalData: rawData,
    };
  } catch (error) {
    console.error('Error parsing file:', error);
    toast.error('Failed to parse file. Please ensure it\'s a valid spreadsheet.');
    return null;
  }
};

export const validateFileType = (file: File): boolean => {
  return supportedFileTypes.includes(file.type);
};

export const cleanNumericValue = (value: any): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // Convert to string and clean it
  let strValue = String(value);
  
  // Remove currency symbols, commas, spaces, and handle parentheses for negative numbers
  strValue = strValue.replace(/[$£€¥]|\s/g, '')
                    .replace(/,/g, '');
  
  // Handle parentheses for negative numbers
  if (strValue.startsWith('(') && strValue.endsWith(')')) {
    strValue = '-' + strValue.slice(1, -1);
  }
  
  // Convert to number
  const numValue = parseFloat(strValue);
  
  return isNaN(numValue) ? null : numValue;
};

export const extractValidNumbers = (data: any[], columnIndex: number): number[] => {
  return data
    .map(row => cleanNumericValue(row[columnIndex]))
    .filter((value): value is number => value !== null);
};
