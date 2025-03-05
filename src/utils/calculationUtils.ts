
export type CalculationParams = {
  riskFreeRate: number;
  tradingPeriods: number;
  targetReturn?: number;
};

export type CalculationResult = {
  sharpeRatio: number;
  sortinoRatio: number;
  meanReturn: number;
  stdDeviation: number;
  downsideDeviation: number;
  totalReturns: number;
  positiveReturns: number;
  negativeReturns: number;
  minReturn: number;
  maxReturn: number;
  annualizedReturn: number;
};

export const calculateSharpeAndSortino = (
  returns: number[],
  params: CalculationParams
): CalculationResult => {
  // Convert annual risk-free rate to per-period rate
  const periodicRiskFreeRate = params.riskFreeRate / 100 / params.tradingPeriods;
  const targetReturn = params.targetReturn !== undefined 
    ? params.targetReturn / 100 / params.tradingPeriods 
    : periodicRiskFreeRate;

  // Calculate mean return
  const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;

  // Calculate standard deviation
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / returns.length;
  const stdDeviation = Math.sqrt(variance);

  // Calculate downside deviation (only negative returns relative to target)
  const negativeDeviations = returns
    .filter(r => r < targetReturn)
    .map(r => Math.pow(targetReturn - r, 2));
  
  const downsideVariance = negativeDeviations.length > 0 
    ? negativeDeviations.reduce((sum, val) => sum + val, 0) / returns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // Calculate Sharpe and Sortino ratios
  const excessReturn = meanReturn - periodicRiskFreeRate;
  const annualizationFactor = Math.sqrt(params.tradingPeriods);

  const sharpeRatio = stdDeviation > 0 
    ? (excessReturn / stdDeviation) * annualizationFactor
    : 0;

  const sortinoRatio = downsideDeviation > 0 
    ? (excessReturn / downsideDeviation) * annualizationFactor
    : 0;

  // Additional statistics
  const positiveReturns = returns.filter(r => r >= 0).length;
  const negativeReturns = returns.filter(r => r < 0).length;
  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);
  const annualizedReturn = (Math.pow(1 + meanReturn, params.tradingPeriods) - 1) * 100;

  return {
    sharpeRatio,
    sortinoRatio,
    meanReturn,
    stdDeviation,
    downsideDeviation,
    totalReturns: returns.length,
    positiveReturns,
    negativeReturns,
    minReturn,
    maxReturn,
    annualizedReturn,
  };
};

export const formatNumber = (value: number, decimals: number = 4): string => {
  return value.toFixed(decimals);
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};
