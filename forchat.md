# Mathematical Implementation of Sharpe and Sortino Ratios

This document provides a detailed explanation of the mathematical foundations and code implementation of the Sharpe and Sortino ratios used in this application. The explanations include both mathematical formulas and corresponding code excerpts.

## 1. Core Financial Concepts

### 1.1 Sharpe Ratio

The Sharpe ratio measures the excess return (or risk premium) per unit of risk in an investment asset or trading strategy.

**Mathematical Formula:**
```
Sharpe Ratio = (Rₚ - Rₑ) / σₚ * √N
```
Where:
- Rₚ = Mean periodic return of the portfolio
- Rₑ = Risk-free rate for the period
- σₚ = Standard deviation of the portfolio's periodic returns (total risk)
- N = Number of periods in a year (annualization factor)

### 1.2 Sortino Ratio

The Sortino ratio is a variation of the Sharpe ratio that differentiates harmful volatility from total overall volatility by using the downside deviation rather than the standard deviation.

**Mathematical Formula:**
```
Sortino Ratio = (Rₚ - Rₑ) / σₚₙ * √N
```
Where:
- Rₚ = Mean periodic return of the portfolio
- Rₑ = Risk-free rate for the period or minimum acceptable return (MAR)
- σₚₙ = Downside deviation of returns that fall below the target return
- N = Number of periods in a year (annualization factor)

## 2. Input Parameters and Data Processing

### 2.1 User Input Parameters

The application collects the following input parameters from the user:

1. **Returns/PnL Column**: The column from the uploaded spreadsheet containing the returns or profit/loss data.

2. **Trading Periods Per Year**: The number of trading periods in a year (e.g., 252 for daily trading days, 12 for monthly returns).

3. **Data Format**: How the returns are represented in the data:
   - **Auto-detect**: Automatically determines if returns are in percentage, decimal, or absolute format.
   - **Percentage (5 = 5%)**: Values like 5 are interpreted as 5%.
   - **Decimal (0.05 = 5%)**: Values like 0.05 are interpreted as 5%.
   - **Absolute ($)**: Values represent absolute dollar amounts (e.g., $1000).

4. **Target Return (%)** (Optional): The minimum acceptable return for the Sortino ratio calculation.

5. **Annual Risk-Free Rate (%)**: The annual risk-free rate (e.g., Treasury bill rate).

6. **Portfolio Value ($)**: When using absolute returns, the total portfolio value is needed to convert returns to percentages.

**Code Implementation:**
```typescript
interface DataPreviewProps {
  data: ParsedData;
  onProceed: (values: number[], params: CalculationParams, dataFormat: string) => void;
  onReset: () => void;
}

// User input state management
const [selectedColumn, setSelectedColumn] = useState<string>('');
const [columnIndex, setColumnIndex] = useState<number>(-1);
const [riskFreeRate, setRiskFreeRate] = useState<string>('0');
const [tradingPeriods, setTradingPeriods] = useState<string>('252');
const [targetReturn, setTargetReturn] = useState<string>('');
const [portfolioValue, setPortfolioValue] = useState<string>('');
const [dataFormat, setDataFormat] = useState<string>('auto');

// Processing input parameters
const handleSubmit = () => {
  const riskFree = parseFloat(riskFreeRate);
  const periods = parseInt(tradingPeriods);
  const target = targetReturn ? parseFloat(targetReturn) : undefined;
  const portfolio = portfolioValue ? parseFloat(portfolioValue) : undefined;

  // Creating calculation parameters
  const params: CalculationParams = {
    riskFreeRate: riskFree,
    tradingPeriods: periods,
    targetReturn: target
  };

  // Add portfolio value to params if provided
  if (portfolio) {
    params.portfolioValue = portfolio;
  }

  // Call calculation with extracted numeric values and parameters
  onProceed(numericValues, params, dataFormat);
};
```

### 2.2 File Upload and Processing

The application accepts spreadsheet files (CSV, Excel) containing returns data. The file processing involves:

1. **File Parsing**: Converting the uploaded file into structured data.
2. **Header and Row Extraction**: Separating column headers and data rows.
3. **Date Handling**: Detecting and converting Excel date formats to readable dates.
4. **Numeric Value Extraction**: Extracting valid numeric values from the selected column.

**Code Implementation:**
```typescript
export const parseFile = async (file: File): Promise<ParsedData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
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
    return null;
  }
};
```

### 2.3 Date Handling

Excel date values are stored as serial numbers (days since January 1, 1900). The application includes functionality to detect and convert these to readable dates:

```typescript
// Detect if a number is likely an Excel date value
export const isExcelDate = (value: number): boolean => {
  return typeof value === 'number' && 
    value > 35000 && value < 60000 && // Range for dates between ~1995 and ~2060
    Math.floor(value) === value || Math.abs(Math.floor(value) - value) > 0.99; // Integer or very close to it
};

// Convert Excel date number to formatted date string
export const formatExcelDate = (excelDate: number): string => {
  // Create a JavaScript date from the Excel date
  const date = XLSX.SSF.parse_date_code(excelDate);
  
  // Format as YYYY-MM-DD
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
};
```

### 2.4 Data Format Detection and Conversion

The application can automatically detect the format of return data by analyzing the magnitude of values:

```typescript
export const extractValidNumbers = (data: any[], columnIndex: number, dataFormat: string = 'auto'): number[] => {
  // Extract and filter valid numeric values
  const values = data
    .map(row => cleanNumericValue(row[columnIndex]))
    .filter((value): value is number => value !== null);
  
  if (values.length === 0) return [];
  
  // Process values based on specified format or auto-detect
  if (dataFormat === 'percent') {
    // User explicitly specified percentage format (5 means 5%)
    return values.map(v => v / 100);
  } else if (dataFormat === 'decimal') {
    // User explicitly specified decimal format (0.05 means 5%)
    return values;
  } else if (dataFormat === 'absolute') {
    // User explicitly specified absolute dollar values - use as-is
    return values;
  } else {
    // Auto-detect format
    const absValues = values.map(v => Math.abs(v));
    const percentRange = absValues.filter(v => v > 1 && v <= 100).length;
    const decimalRange = absValues.filter(v => v > 0 && v < 1).length;
    const absoluteRange = absValues.filter(v => v > 100).length;
    
    // Determine format based on value ranges
    if (percentRange > 0.7 * values.length) {
      return values.map(v => v / 100); // Convert percentages to decimals
    } else if (decimalRange > 0.7 * values.length) {
      return values; // Already in decimal form
    } else if (absoluteRange > 0.7 * values.length) {
      return values; // Use absolute values as-is
    }
    
    // Fallback detection based on magnitude
    const maxAbsValue = Math.max(...absValues);
    const minAbsValue = Math.min(...absValues.filter(v => v > 0));
    
    if (maxAbsValue <= 100 && minAbsValue >= 0.01) {
      return values.map(v => v / 100); // Likely percentages
    }
    
    // Default to using values as-is
    return values;
  }
};
```

## 3. Risk-Free Rate Conversion

Converting an annual risk-free rate to a periodic rate (e.g., daily, monthly) requires using the compound interest formula rather than simple division.

**Mathematical Formula:**
```
Periodic Risk-Free Rate = (1 + Annual Rate)^(1/N) - 1
```
Where N is the number of periods in a year.

**Code Implementation:**
```typescript
// Convert annual risk-free rate to the period used in data (e.g., daily, monthly)
const periodicRiskFreeRate = Math.pow(1 + params.riskFreeRate / 100, 1 / params.tradingPeriods) - 1;

// Apply the same conversion to target return if provided, otherwise use the periodic risk-free rate
const targetReturn = params.targetReturn !== undefined 
  ? Math.pow(1 + params.targetReturn / 100, 1 / params.tradingPeriods) - 1
  : periodicRiskFreeRate;
```

## 4. Data Processing and Normalization

### 4.1 Data Format Handling

The application handles three data formats for returns:
- Percentage format (e.g., 5 for 5%)
- Decimal format (e.g., 0.05 for 5%)
- Absolute dollar returns (e.g., $1000 profit/loss)

**Code Implementation:**
```typescript
// Handle different data formats
const isAbsoluteFormat = params.dataFormat === 'absolute';
  
// Store original returns for reporting
const originalReturns = [...returns];
  
// For absolute returns, attempt to convert to fractional returns if portfolio value is provided
let returnsForCalculation = [...returns];
let fractionalConverted = false;
  
if (isAbsoluteFormat && params.portfolioValue) {
  const { convertedReturns, wasConverted } = convertToFractionalReturns(returns, params.portfolioValue);
  if (wasConverted) {
    returnsForCalculation = convertedReturns;
    fractionalConverted = true;
  }
}
```

### 4.2 Converting Absolute Returns to Fractional Returns

For meaningful risk-adjusted performance metrics, absolute dollar returns must be converted to fractional (percentage) returns using the portfolio value.

**Code Implementation:**
```typescript
const convertToFractionalReturns = (
  returns: number[],
  portfolioValue?: number
): { convertedReturns: number[], wasConverted: boolean } => {
  // If no portfolio value is provided, we can't convert
  if (!portfolioValue || portfolioValue <= 0) {
    return { convertedReturns: returns, wasConverted: false };
  }

  // Convert each absolute return to a fractional return
  const convertedReturns = returns.map(r => r / portfolioValue);
  
  return { convertedReturns, wasConverted: true };
};
```

## 5. Statistical Calculations

### 5.1 Mean Return

The arithmetic mean of the returns over the measurement period.

**Mathematical Formula:**
```
Mean Return = (Σ Rᵢ) / n
```
Where Rᵢ represents each individual return and n is the number of returns.

**Code Implementation:**
```typescript
// Calculate mean return
const meanReturn = returnsForCalculation.reduce((sum, val) => sum + val, 0) / returnsForCalculation.length;
```

### 5.2 Standard Deviation

Standard deviation measures the dispersion of returns around the mean, representing total risk.

**Mathematical Formula:**
```
Standard Deviation = √[(Σ(Rᵢ - R̄)²) / (n-1)]
```
Where Rᵢ is each return, R̄ is the mean return, and n is the sample size. Note the use of (n-1) for sample standard deviation.

**Code Implementation:**
```typescript
// Calculate standard deviation using sample formula (n-1 denominator)
const variance = returnsForCalculation.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returnsForCalculation.length - 1);
const stdDeviation = Math.sqrt(variance);
```

### 5.3 Downside Deviation

Downside deviation measures only the negative deviations from a target return, focusing on harmful volatility.

**Mathematical Formula:**
```
Downside Deviation = √[(Σ min(0, Rᵢ - T)²) / m]
```
Where Rᵢ is each return, T is the target return, and m is the number of returns below the target.

**Code Implementation:**
```typescript
// Calculate downside deviation (only negative returns relative to target)
const negativeDeviations = returnsForCalculation
  .filter(r => r < targetReturn)
  .map(r => Math.pow(targetReturn - r, 2));

const downsideVariance = negativeDeviations.length > 0 
  ? negativeDeviations.reduce((sum, val) => sum + val, 0) / negativeDeviations.length
  : 0;
const downsideDeviation = Math.sqrt(downsideVariance);
```

## 6. Ratio Calculations

### 6.1 Sharpe Ratio Calculation

**Code Implementation:**
```typescript
// Calculate excess return
const excessReturn = meanReturn - periodicRiskFreeRate;
const annualizationFactor = Math.sqrt(params.tradingPeriods);

// Define a small epsilon threshold to avoid division by very small numbers
const EPSILON = 1e-8;

// Calculate Sharpe ratio with protection against near-zero standard deviation
let sharpeRatio = 0;
if (stdDeviation > EPSILON) {
  // Annualization is done by multiplying by sqrt(trading periods)
  sharpeRatio = (excessReturn / stdDeviation) * annualizationFactor;
}
```

### 6.2 Sortino Ratio Calculation

**Code Implementation:**
```typescript
// Calculate Sortino ratio with protection against near-zero downside deviation
let sortinoRatio = 0;
if (downsideDeviation > EPSILON) {
  // Annualization is done by multiplying by sqrt(trading periods)
  sortinoRatio = (excessReturn / downsideDeviation) * annualizationFactor;
}
```

## 7. Return Statistics

The application calculates and displays a comprehensive set of return statistics:

### 7.1 Core Performance Metrics

1. **Sharpe Ratio**: The risk-adjusted return using standard deviation.
2. **Sortino Ratio**: The risk-adjusted return using downside deviation.
3. **Mean Return (per period)**: The arithmetic average return for each period.
4. **Annualized Return**: The mean return scaled to an annual basis.

### 7.2 Risk Metrics

1. **Standard Deviation**: Measure of total volatility.
2. **Downside Deviation**: Measure of harmful volatility below target return.

### 7.3 Distribution Statistics

1. **Total Data Points**: Number of return observations analyzed.
2. **Positive Returns**: Count of observations with returns >= 0.
3. **Negative Returns**: Count of observations with returns < 0.
4. **Minimum Return**: The lowest return in the dataset.
5. **Maximum Return**: The highest return in the dataset.

**Code Implementation for Calculating Statistics:**
```typescript
// Calculate additional statistics
const originalMeanReturn = originalReturns.reduce((sum, val) => sum + val, 0) / originalReturns.length;
const positiveReturns = originalReturns.filter(r => r >= 0).length;
const negativeReturns = originalReturns.filter(r => r < 0).length;
const minReturn = Math.min(...originalReturns);
const maxReturn = Math.max(...originalReturns);
```

### 7.4 Annualized Return Calculation

Annualized return calculation differs based on whether returns are in absolute dollar values or fractional form.

#### 7.4.1 For Absolute Dollar Returns

For absolute dollar values, a simple linear projection is used:

**Mathematical Formula:**
```
Annualized Return = Mean Return per Period × Number of Periods per Year
```

**Code Implementation:**
```typescript
// For absolute dollar values, use a simple yearly projection
annualizedReturn = originalMeanReturn * params.tradingPeriods;
```

#### 7.4.2 For Fractional Returns

For percentage/decimal returns, the compound interest formula is used:

**Mathematical Formula:**
```
Annualized Return = (1 + Mean Return per Period)^Number of Periods per Year - 1
```

**Code Implementation:**
```typescript
// For percentage/decimal returns, use the compound interest formula
annualizedReturn = Math.pow(1 + originalMeanReturn, params.tradingPeriods) - 1;
```

### 7.5 Results Formatting

The application formats results differently based on the data format:

```typescript
// Format value based on data format
const formatValue = (value: number, decimals: number = 2): string => {
  if (dataFormat === 'absolute') {
    // For absolute values, just show the number with fixed decimals
    return value.toFixed(decimals);
  }
  // For percentages or decimals, use formatPercent
  return formatPercent(value);
};

// Format annualized return
const formatAnnualizedReturn = (value: number, decimals: number = 2): string => {
  // First ensure the value is a valid number and not NaN or Infinity
  const validValue = isFinite(value) ? value : 0;
  
  if (dataFormat === 'absolute') {
    // For absolute values, format as currency with fixed decimals
    return `$${validValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }
  
  // For percentages or decimals, show with % sign
  return `${(validValue * 100).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
};
```

## 8. Key Implementation Considerations

### 8.1 Dimensional Consistency

One of the critical aspects of calculating financial ratios is maintaining dimensional consistency. When using absolute dollar returns, they must be converted to fractional returns before applying standard formulas.

### 8.2 Sample vs. Population Standard Deviation

The implementation uses sample standard deviation (n-1 denominator) rather than population standard deviation (n denominator) to provide a more conservative estimate of volatility.

```typescript
// Sample standard deviation (n-1 denominator)
const variance = returnsForCalculation.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returnsForCalculation.length - 1);
```

### 8.3 Downside Deviation Methodology

For the Sortino ratio, the downside deviation is calculated by dividing the downside variance by the number of negative deviations rather than the total sample size. This provides a more accurate assessment of downside risk.

```typescript
const downsideVariance = negativeDeviations.length > 0 
  ? negativeDeviations.reduce((sum, val) => sum + val, 0) / negativeDeviations.length
  : 0;
```

### 8.4 Division by Zero Protection

To handle cases where the standard deviation or downside deviation might be zero or very small, the implementation includes protection against division by very small numbers:

```typescript
const EPSILON = 1e-8;

// Only calculate ratio if denominator is sufficiently large
if (stdDeviation > EPSILON) {
  sharpeRatio = (excessReturn / stdDeviation) * annualizationFactor;
}
```

## 9. Complete Flow: From File Upload to Results

1. **File Upload**:
   - User uploads a spreadsheet file (CSV, Excel)
   - File is parsed using the `parseFile` function
   - Headers and data rows are extracted

2. **Data Configuration**:
   - User selects the Returns/PnL column
   - User chooses or confirms data format (auto-detect, percentage, decimal, absolute)
   - User enters Trading Periods Per Year (default: 252)
   - User enters Annual Risk-Free Rate (default: 0)
   - User optionally provides Target Return and Portfolio Value

3. **Data Processing**:
   - Selected column data is extracted and converted to numeric values
   - If using absolute returns with portfolio value, values are converted to fractional returns
   - Risk-free rate and target return are converted from annual to periodic rates

4. **Statistical Calculations**:
   - Mean return is calculated
   - Standard deviation is calculated using sample formula (n-1)
   - Downside deviation is calculated using negative deviations only
   - Return distribution statistics are determined (min, max, positive count, negative count)

5. **Ratio Calculations**:
   - Sharpe ratio = (Mean Return - Risk-Free Rate) / Standard Deviation × √Trading Periods
   - Sortino ratio = (Mean Return - Risk-Free Rate) / Downside Deviation × √Trading Periods
   - Annualized return is calculated based on data format

6. **Results Display**:
   - Results are formatted according to data format
   - Statistics are displayed in cards and tables
   - Return distribution is visualized with a histogram

## 10. Complete Mathematical Implementation

The core calculation function integrates all these components to produce the Sharpe and Sortino ratios:

```typescript
export const calculateSharpeAndSortino = (
  returns: number[],
  params: CalculationParams
): CalculationResult => {
  // Data format handling and conversion
  const isAbsoluteFormat = params.dataFormat === 'absolute';
  const originalReturns = [...returns];
  let returnsForCalculation = [...returns];
  let fractionalConverted = false;
  
  if (isAbsoluteFormat && params.portfolioValue) {
    const { convertedReturns, wasConverted } = convertToFractionalReturns(returns, params.portfolioValue);
    if (wasConverted) {
      returnsForCalculation = convertedReturns;
      fractionalConverted = true;
    }
  }

  // Convert annual risk-free rate to the period used in data
  const periodicRiskFreeRate = Math.pow(1 + params.riskFreeRate / 100, 1 / params.tradingPeriods) - 1;
  const targetReturn = params.targetReturn !== undefined 
    ? Math.pow(1 + params.targetReturn / 100, 1 / params.tradingPeriods) - 1
    : periodicRiskFreeRate;

  // Calculate mean return and standard deviation
  const meanReturn = returnsForCalculation.reduce((sum, val) => sum + val, 0) / returnsForCalculation.length;
  const variance = returnsForCalculation.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returnsForCalculation.length - 1);
  const stdDeviation = Math.sqrt(variance);

  // Calculate downside deviation
  const negativeDeviations = returnsForCalculation
    .filter(r => r < targetReturn)
    .map(r => Math.pow(targetReturn - r, 2));
  
  const downsideVariance = negativeDeviations.length > 0 
    ? negativeDeviations.reduce((sum, val) => sum + val, 0) / negativeDeviations.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // Calculate excess return and annualization factor
  const excessReturn = meanReturn - periodicRiskFreeRate;
  const annualizationFactor = Math.sqrt(params.tradingPeriods);
  const EPSILON = 1e-8;

  // Calculate ratios with protection against division by small numbers
  let sharpeRatio = 0;
  if (stdDeviation > EPSILON) {
    sharpeRatio = (excessReturn / stdDeviation) * annualizationFactor;
  }

  let sortinoRatio = 0;
  if (downsideDeviation > EPSILON) {
    sortinoRatio = (excessReturn / downsideDeviation) * annualizationFactor;
  }

  // Calculate additional statistics
  const originalMeanReturn = originalReturns.reduce((sum, val) => sum + val, 0) / originalReturns.length;
  const positiveReturns = originalReturns.filter(r => r >= 0).length;
  const negativeReturns = originalReturns.filter(r => r < 0).length;
  const minReturn = Math.min(...originalReturns);
  const maxReturn = Math.max(...originalReturns);
  
  // Calculate annualized return
  let annualizedReturn;
  if (params.dataFormat === 'absolute') {
    annualizedReturn = originalMeanReturn * params.tradingPeriods;
  } else {
    annualizedReturn = Math.pow(1 + originalMeanReturn, params.tradingPeriods) - 1;
  }

  return {
    sharpeRatio,
    sortinoRatio,
    meanReturn: originalMeanReturn,
    stdDeviation,
    downsideDeviation,
    totalReturns: originalReturns.length,
    positiveReturns,
    negativeReturns,
    minReturn,
    maxReturn,
    annualizedReturn,
  };
};
``` 