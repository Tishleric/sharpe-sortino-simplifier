import * as XLSX from 'xlsx';
import { CalculationResult, CalculationParams } from '@/utils/calculationUtils';

// Utility to safely quote sheet names for Excel formulas
function quoteSheetName(name) {
  // Excel requires single quotes around sheet names with spaces or special chars, and double single quotes inside
  if (/[^A-Za-z0-9_]/.test(name)) {
    return `'${name.replace(/'/g, "''")}'`;
  }
  return name;
}

export function exportAnalysisToXLSX(
  result: CalculationResult,
  returnValues: number[],
  params: CalculationParams
) {
  // --- Prepare data ---
  const rawReturns = [...returnValues];
  const fracReturns =
    params.dataFormat === 'absolute' && params.portfolioValue
      ? returnValues.map(r => r / params.portfolioValue)
      : [];
  const N = rawReturns.length;

  // Compute core metrics in JS (for Breakdown sheet)
  const meanFrac =
    fracReturns.length > 0
      ? fracReturns.reduce((sum, v) => sum + v, 0) / fracReturns.length
      : 0;
  const varianceFrac =
    fracReturns.length > 1
      ? fracReturns.reduce((sum, v) => sum + (v - meanFrac) ** 2, 0) / (fracReturns.length - 1)
      : 0;
  const stdDevFrac = Math.sqrt(varianceFrac);

  const periodicRf = Math.pow(1 + params.riskFreeRate / 100, 1 / params.tradingPeriods) - 1;
  const targetFrac = params.targetReturn !== undefined
    ? Math.pow(1 + params.targetReturn / 100, 1 / params.tradingPeriods) - 1
    : periodicRf;
  const downSquares = fracReturns.filter(v => v < targetFrac).map(v => (targetFrac - v) ** 2);
  const downsideDev = Math.sqrt(
    downSquares.length > 0
      ? downSquares.reduce((sum, v) => sum + v, 0) / downSquares.length
      : 0
  );

  // --- Sheet 1: Inputs & Summary ---
  // Table: Index | Raw Return | Frac Return
  const tableAoA = [
    ['Index', 'Raw Return', 'Frac Return'],
    ...rawReturns.map((r, i) => [i + 1, r, fracReturns[i] ?? ''])
  ];
  const wsInputs = XLSX.utils.aoa_to_sheet(tableAoA);

  // Parameters block (right of table)
  const targetReturnValue = params.targetReturn !== undefined && params.targetReturn !== null
    ? params.targetReturn
    : 0;
  const paramBlock = [
    ['Parameter', 'Value'],
    ['Risk Free Rate', params.riskFreeRate],
    ['Target Return', targetReturnValue],
    ['Trading Periods', params.tradingPeriods],
  ];
  if (params.portfolioValue) {
    paramBlock.push(['Portfolio Value', params.portfolioValue]);
  }
  XLSX.utils.sheet_add_aoa(wsInputs, paramBlock, { origin: { r: 0, c: 5 } });

  // Named cell references for formulas
  const paramRow = 2; // G2 = Risk Free, G3 = Target, G4 = Trading Periods, G5 = Portfolio Value (if present)
  const paramCol = 'G';
  const sheetName = 'Inputs & Summary';
  const quotedSheet = quoteSheetName(sheetName);
  const fracCol = 'C';
  const startRow = 2;
  const endRow = N + 1;

  // Summary block (below parameters)
  const summaryStartRow = paramBlock.length + 2;
  const summaryMetrics = [
    { label: 'Mean', formula: `AVERAGE(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow})` },
    { label: 'Std Dev', formula: `STDEV.S(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow})` },
    {
      label: 'Downside Dev',
      formula: `SQRT(SUMPRODUCT(( ${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow} < ${quotedSheet}!$${paramCol}$3 ) * ( (${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow} - ${quotedSheet}!$${paramCol}$3 )^2 )) / COUNTIF(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow},"<"&${quotedSheet}!$${paramCol}$3))`,
    },
    {
      label: 'Sharpe Ratio',
      formula: `(AVERAGE(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow}) - ${quotedSheet}!$${paramCol}$2) / STDEV.S(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow}) * SQRT(${quotedSheet}!$${paramCol}$4)`,
    },
    {
      label: 'Sortino Ratio',
      formula: `(AVERAGE(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow}) - ${quotedSheet}!$${paramCol}$2) / SQRT(SUMPRODUCT(( ${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow} < ${quotedSheet}!$${paramCol}$3 ) * ( (${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow} - ${quotedSheet}!$${paramCol}$3 )^2 )) / COUNTIF(${quotedSheet}!${fracCol}${startRow}:${fracCol}${endRow},"<"&${quotedSheet}!$${paramCol}$3)) * SQRT(${quotedSheet}!$${paramCol}$4)`,
    },
  ];
  // Write summary block
  wsInputs[`F${summaryStartRow}`] = { t: 's', v: 'Summary Metric' };
  wsInputs[`G${summaryStartRow}`] = { t: 's', v: 'Value' };
  summaryMetrics.forEach((item, idx) => {
    wsInputs[`F${summaryStartRow + idx + 1}`] = { t: 's', v: item.label };
    wsInputs[`G${summaryStartRow + idx + 1}`] = { t: 'n', f: item.formula };
  });

  // Format: bold headers, 4 decimals, freeze header row
  wsInputs['!rows'] = [{ hpt: 20, level: 0 }];
  wsInputs['!cols'] = [
    { wch: 6 }, // Index
    { wch: 12 }, // Raw
    { wch: 12 }, // Frac
    { wch: 16 }, // Metric
    { wch: 16 }, // Value
    { wch: 16 }, // Param
    { wch: 16 }, // Param val
  ];
  wsInputs['!freeze'] = { xSplit: 0, ySplit: 1 }; // Freeze header

  // ----- Sheet 2: Breakdown -----
  const breakAoA = [
    [
      'Index',
      'Raw Return',
      'Frac Return',
      'Frac - Mean',
      '(Frac - Mean)^2',
      'Is Downside',
      '(Target - Frac)^2',
    ],
    ...fracReturns.map((v, i) => {
      const diff = v - meanFrac;
      const sq = diff * diff;
      const isDown = v < targetFrac;
      const downSq = isDown ? (targetFrac - v) ** 2 : 0;
      return [i + 1, rawReturns[i], v, diff, sq, isDown, downSq];
    }),
    [],
    ['Summary'],
    ['Mean (calc)', meanFrac],
    ['Std Dev (calc)', stdDevFrac],
    ['Downside Dev', downsideDev],
    ['Sharpe Ratio', result.sharpeRatio],
    ['Sortino Ratio', result.sortinoRatio],
  ];
  const wsBreak = XLSX.utils.aoa_to_sheet(breakAoA);
  wsBreak['!outline'] = [{ level: 1, start: 1, end: N }]; // Collapsible group for per-row calcs

  // ----- Sheet 3: Methodology -----
  const methodAoA = [
    ['Metric', 'Explanation'],
    ['Mean', 'Average of fractional returns'],
    ['Std Dev', 'Sample standard deviation (n-1) of fractional returns'],
    ['Downside Dev', 'Sample std dev of returns below target (risk-free if unspecified)'],
    ['Sharpe Ratio', '=(Mean - Risk Free) / Std Dev * SQRT(Trading Periods)'],
    ['Sortino Ratio', '=(Mean - Risk Free) / Downside Dev * SQRT(Trading Periods)'],
    ['Data Format', 'Raw = $; Frac = return/portfolio if provided; all metrics use Frac'],
    ['All formulas are live and reference the parameter block in Inputs & Summary.'],
  ];
  const wsMethod = XLSX.utils.aoa_to_sheet(methodAoA);

  // ----- Assemble Workbook -----
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInputs, sheetName);
  XLSX.utils.book_append_sheet(wb, wsBreak, 'Breakdown');
  XLSX.utils.book_append_sheet(wb, wsMethod, 'Methodology');

  // --- Write file with timestamp to avoid caching issues ---
  const date = new Date().toISOString().split('T')[0];
  const ts = new Date().getTime();
  const filename = `sharpe-sortino-analysis-${date}-${ts}.xlsx`;
  XLSX.writeFile(wb, filename);
} 