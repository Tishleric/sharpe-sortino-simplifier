export type CalculationParams = {
  riskFreeRate: number;
  tradingPeriods: number;
  targetReturn?: number;
  dataFormat?: string;
  portfolioValue?: number; // Optional portfolio value for converting absolute returns to fractional
};

export type CalculationResult = {
  sharpeRatio: number;
  sortinoRatio: number;
  meanReturn: number;       // arithmetic mean
  geoMean: number;          // geometric mean (CAGR base)
  stdDeviation: number;
  downsideDeviation: number;
  totalReturns: number;
  positiveReturns: number;
  negativeReturns: number;
  minReturn: number;
  maxReturn: number;
  annualizedReturn: number;
  sharpeSE: number;         // Standard error of Sharpe ratio
  excessReturn: number;     // Mean return minus risk-free rate
};

/**
 * Converts absolute returns to fractional returns if possible
 * @param returns Absolute returns array
 * @param portfolioValue The portfolio value/capital base (if provided)
 * @returns Fractional returns array or original array if conversion not possible
 */
const convertToFractionalReturns = (
  returns: number[],
  portfolioValue?: number
): { convertedReturns: number[], wasConverted: boolean } => {
  // If no portfolio value is provided, we can't convert
  if (!portfolioValue || portfolioValue <= 0) {
    console.log('No valid portfolio value provided for conversion to fractional returns');
    return { convertedReturns: returns, wasConverted: false };
  }

  // Convert each absolute return to a fractional return
  const convertedReturns = returns.map(r => r / portfolioValue);
  console.log(`Converted absolute returns to fractional returns using portfolio value: ${portfolioValue}`);
  console.log(`Sample conversions: ${returns.slice(0, 3).map((r, i) => `$${r} → ${(r/portfolioValue).toFixed(4)}`).join(', ')}`);
  
  return { convertedReturns, wasConverted: true };
};

export const calculateSharpeAndSortino = (
  returns: number[],
  params: CalculationParams
): CalculationResult => {
  // Log input parameters
  console.log('Calculation parameters:', { 
    returnCount: returns.length,
    returns: returns.slice(0, 5).join(', ') + (returns.length > 5 ? '...' : ''),
    params 
  });

  // 1. Enforce fractional returns for absolute data
  if (params.dataFormat === 'absolute' && !params.portfolioValue) {
    throw new Error('Portfolio value is required for absolute returns to calculate ratios accurately');
  }

  const isAbsoluteFormat = params.dataFormat === 'absolute';
  const originalReturns = [...returns];
  const { convertedReturns, wasConverted } =
    isAbsoluteFormat && params.portfolioValue
      ? convertToFractionalReturns(returns, params.portfolioValue)
      : { convertedReturns: returns, wasConverted: false };

  if (isAbsoluteFormat && !params.portfolioValue) {
    console.log('WARNING: Using absolute dollar returns for ratio calculations. For standard financial metrics, consider converting to fractional returns.');
  }

  const returnsForCalculation = convertedReturns;
  Object.freeze(returnsForCalculation);
  console.log('Length after conversion', returnsForCalculation.length);
  console.log('First 10 returnsForCalculation', returnsForCalculation.slice(0,10));
  console.log('Arithmetic mean check', returnsForCalculation
              .reduce((s,r)=>s+r,0)/returnsForCalculation.length);
  
  const fractionalConverted = wasConverted;

  // Convert annual risk-free rate to periodic using compound formula
  const periodicRiskFreeRate = Math.pow(1 + params.riskFreeRate / 100, 1 / params.tradingPeriods) - 1;
  // Target return conversion (if provided)
  const targetReturn = params.targetReturn !== undefined 
    ? Math.pow(1 + params.targetReturn / 100, 1 / params.tradingPeriods) - 1
    : periodicRiskFreeRate;

  // 2. Geometric mean (CAGR) for annualisation
  // Calculate geometric mean of returns: exp(mean(log(1+r))) - 1
  const gm = Math.exp(
    returnsForCalculation.reduce((s, r) => s + Math.log(1 + r), 0) / returnsForCalculation.length
  ) - 1;
  
  // 3. Annualized return using geometric mean only
  const annualizedReturn = Math.pow(1 + gm, params.tradingPeriods) - 1;

  // Calculate arithmetic mean (for Sharpe/Sortino and excess return)
  const meanReturn = returnsForCalculation.reduce((sum, val) => sum + val, 0) / returnsForCalculation.length;

  // Standard deviation (sample, n-1)
  const variance = returnsForCalculation.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returnsForCalculation.length - 1);
  const stdDeviation = Math.sqrt(variance);

  // Log intermediate calculation values
  console.log('Intermediate values:', {
    meanReturn,
    stdDeviation,
    periodicRiskFreeRate,
    targetReturn,
    isAbsoluteFormat,
    fractionalConverted,
    gm,
    annualizedReturn
  });

  // 3. Downside deviation: use (m-1) denominator, fallback to 1 if only one value
  const negativeDeviations = returnsForCalculation
    .filter(r => r < targetReturn)
    .map(r => Math.pow(targetReturn - r, 2));
  const downsideVariance = negativeDeviations.length > 0
    ? negativeDeviations.reduce((sum, val) => sum + val, 0) / ((negativeDeviations.length - 1) || 1)
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // 4. Calculate Sharpe and Sortino ratios, excess return, and Sharpe SE
  const excessReturn = meanReturn - periodicRiskFreeRate;
  const annualizationFactor = Math.sqrt(params.tradingPeriods);
  const EPSILON = 1e-8;
  let sharpeRatio = 0;
  if (stdDeviation > EPSILON) {
    sharpeRatio = (excessReturn / stdDeviation) * annualizationFactor;
    if (isAbsoluteFormat && !fractionalConverted) {
      console.log('NOTE: Sharpe ratio calculated using absolute returns may not be comparable to standard benchmarks.');
    }
  }
  let sortinoRatio = 0;
  if (downsideDeviation > EPSILON) {
    sortinoRatio = (excessReturn / downsideDeviation) * annualizationFactor;
    if (isAbsoluteFormat && !fractionalConverted) {
      console.log('NOTE: Sortino ratio calculated using absolute returns may not be comparable to standard benchmarks.');
    }
  }
  // Sharpe standard error (SE) formula
  const sharpeSE = (returnsForCalculation.length > 1)
    ? Math.sqrt((1 + 0.5 * Math.pow(sharpeRatio, 2)) / (returnsForCalculation.length - 1))
    : 0;

  // Additional statistics - use original returns for reporting
  const positiveReturns = originalReturns.filter(r => r >= 0).length;
  const negativeReturns = originalReturns.filter(r => r < 0).length;
  const minReturn = Math.min(...originalReturns);
  const maxReturn = Math.max(...originalReturns);

  // Log the final results
  console.log('Final calculation results:', {
    sharpeRatio,
    sortinoRatio,
    meanReturn,
    geoMean: gm,
    stdDeviation,
    downsideDeviation,
    totalReturns: originalReturns.length,
    positiveReturns,
    negativeReturns,
    minReturn,
    maxReturn,
    annualizedReturn,
    sharpeSE,
    excessReturn
  });

  return {
    sharpeRatio,
    sortinoRatio,
    meanReturn,
    geoMean: gm,
    stdDeviation,
    downsideDeviation,
    totalReturns: originalReturns.length,
    positiveReturns,
    negativeReturns,
    minReturn,
    maxReturn,
    annualizedReturn,
    sharpeSE,
    excessReturn
  };
};

export const formatNumber = (value: number, decimals: number = 4): string => {
  return value.toFixed(decimals);
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};
