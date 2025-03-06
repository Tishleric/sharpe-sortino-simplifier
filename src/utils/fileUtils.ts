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

// Detect if a number is likely an Excel date value
// Excel dates are serial numbers counting days since Jan 1, 1900
// Modern dates typically have values between 40000-50000
export const isExcelDate = (value: number): boolean => {
  if (typeof value !== 'number') return false;
  
  // Check if the value is within a reasonable Excel date range (1995–2060, roughly 35000–60000)
  if (value < 35000 || value > 60000) return false;
  
  // Allow both integers and decimals (fractional for time components)
  const integerPart = Math.floor(value);
  const decimalPart = value - integerPart;
  
  // If it's an integer or has a decimal part typical of Excel dates (0 ≤ decimal < 1)
  return integerPart >= 35000 && integerPart <= 60000 && decimalPart >= 0 && decimalPart < 1;
};

// Convert Excel date number to formatted date string
export const formatExcelDate = (excelDate: number): string => {
  // Excel's date system has a leap year bug from 1900
  // Dates are off by 1 day for dates after Feb 28, 1900
  // XLSX.js accounts for this already
  
  // Create a JavaScript date from the Excel date
  const date = XLSX.SSF.parse_date_code(excelDate);
  
  // Format as YYYY-MM-DD
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
};

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
    
    // Convert numeric Excel dates (including fractional dates with times) to readable strings in all cells
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex++) {
        const value = rows[rowIndex][colIndex];
        if (typeof value === 'number' && isExcelDate(value)) {
          rows[rowIndex][colIndex] = formatExcelDate(value);
        }
      }
    }
    
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

export const extractValidNumbers = (
  data: any[],
  columnIndex: number,
  dataFormat: string = 'auto'
): { values: number[], detectedFormat: string } => {
  // Extract and filter valid numeric values
  const values = data
    .map(row => cleanNumericValue(row[columnIndex]))
    .filter((value): value is number => value !== null);
  
  if (values.length === 0) return { values: [], detectedFormat: 'unknown' };
  
  // Process values based on specified format or auto-detect
  let processedValues: number[];
  let format: string;

  if (dataFormat === 'percent') {
    // User explicitly specified percentage format (5 means 5%)
    processedValues = values.map(v => v / 100);
    format = 'percent';
  } else if (dataFormat === 'decimal') {
    // User explicitly specified decimal format (0.05 means 5%)
    processedValues = values;
    format = 'decimal';
  } else if (dataFormat === 'absolute') {
    // User explicitly specified absolute dollar values - use as-is
    processedValues = values;
    format = 'absolute';
  } else {
    // Auto-detect format - with more rigorous checks
    // Sample all values for a more accurate assessment
    const absValues = values.map(v => Math.abs(v));
    const maxAbsValue = Math.max(...absValues);
    const minAbsValue = Math.min(...absValues.filter(v => v > 0)); // Smallest non-zero value
    
    // Count values in different ranges
    const percentRange = absValues.filter(v => v > 1 && v <= 100).length;
    const decimalRange = absValues.filter(v => v > 0 && v < 1).length;
    const absoluteRange = absValues.filter(v => v > 100).length;
    
    // If most values are between 1 and 100, and there are few outliers, they're likely percentages
    if (percentRange > 0.7 * values.length) {
      console.log('Auto-detected format: percentage - converting to decimal');
      processedValues = values.map(v => v / 100);
      format = 'percent';
    }
    
    // If most values are small decimals (0.01-0.99), they're likely already in decimal form
    else if (decimalRange > 0.7 * values.length) {
      console.log('Auto-detected format: decimal - using as is');
      processedValues = values;
      format = 'decimal';
    }
    
    // If most values are large (>100), they're likely absolute values
    else if (absoluteRange > 0.7 * values.length) {
      console.log('Auto-detected format: absolute - using as is');
      processedValues = values;
      format = 'absolute';
    }
    
    // If we can't clearly determine, use a more conservative approach
    // Check the magnitude of values
    else if (maxAbsValue <= 100 && minAbsValue >= 0.01) {
      console.log('Auto-detected format: percentage (fallback) - converting to decimal');
      processedValues = values.map(v => v / 100);
      format = 'percent';
    }
    
    // Default to using values as-is
    else {
      console.log('Auto-detection inconclusive - using values as-is');
      processedValues = values;
      format = 'decimal';
    }
  }

  return { values: processedValues, detectedFormat: format };
};
