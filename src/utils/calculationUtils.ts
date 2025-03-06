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

  // Determine if we're working with absolute returns
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
      console.log('Using converted fractional returns for ratio calculations');
    } else {
      console.log('WARNING: Using absolute dollar returns for ratio calculations. For standard financial metrics, consider providing a portfolio value.');
    }
  } else if (isAbsoluteFormat) {
    console.log('WARNING: Using absolute dollar returns for ratio calculations. For standard financial metrics, consider converting to fractional returns.');
  }

  // Convert annual risk-free rate to the period used in data (e.g., daily, monthly)
  const periodicRiskFreeRate = Math.pow(1 + params.riskFreeRate / 100, 1 / params.tradingPeriods) - 1;
  
  // Apply the same conversion to target return if provided, otherwise use the periodic risk-free rate
  const targetReturn = params.targetReturn !== undefined 
    ? Math.pow(1 + params.targetReturn / 100, 1 / params.tradingPeriods) - 1
    : periodicRiskFreeRate;

  // Calculate mean return using the appropriate returns array
  const meanReturn = returnsForCalculation.reduce((sum, val) => sum + val, 0) / returnsForCalculation.length;

  // Calculate standard deviation
  const variance = returnsForCalculation.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / (returnsForCalculation.length - 1);
  const stdDeviation = Math.sqrt(variance);

  // Log intermediate calculation values
  console.log('Intermediate values:', {
    meanReturn,
    stdDeviation,
    periodicRiskFreeRate,
    targetReturn,
    isAbsoluteFormat,
    fractionalConverted
  });

  // Calculate downside deviation (only negative returns relative to target)
  const negativeDeviations = returnsForCalculation
    .filter(r => r < targetReturn)
    .map(r => Math.pow(targetReturn - r, 2));
  
  const downsideVariance = negativeDeviations.length > 0 
    ? negativeDeviations.reduce((sum, val) => sum + val, 0) / negativeDeviations.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // Calculate Sharpe and Sortino ratios
  const excessReturn = meanReturn - periodicRiskFreeRate;
  const annualizationFactor = Math.sqrt(params.tradingPeriods);

  // Define a small epsilon threshold to avoid division by very small numbers
  const EPSILON = 1e-8;

  // Calculate Sharpe ratio with protection against near-zero standard deviation
  let sharpeRatio = 0;
  if (stdDeviation > EPSILON) {
    // Calculate Sharpe ratio: (mean return - risk free rate) / standard deviation
    // Annualization is done by multiplying by sqrt(trading periods)
    sharpeRatio = (excessReturn / stdDeviation) * annualizationFactor;
    
    if (isAbsoluteFormat && !fractionalConverted) {
      console.log('NOTE: Sharpe ratio calculated using absolute returns may not be comparable to standard benchmarks.');
    }
  }

  // Calculate Sortino ratio with the same protections
  let sortinoRatio = 0;
  if (downsideDeviation > EPSILON) {
    // Calculate Sortino ratio: (mean return - risk free rate) / downside deviation
    sortinoRatio = (excessReturn / downsideDeviation) * annualizationFactor;
    
    if (isAbsoluteFormat && !fractionalConverted) {
      console.log('NOTE: Sortino ratio calculated using absolute returns may not be comparable to standard benchmarks.');
    }
  }

  // Additional statistics - use original returns for reporting
  const originalMeanReturn = originalReturns.reduce((sum, val) => sum + val, 0) / originalReturns.length;
  const positiveReturns = originalReturns.filter(r => r >= 0).length;
  const negativeReturns = originalReturns.filter(r => r < 0).length;
  const minReturn = Math.min(...originalReturns);
  const maxReturn = Math.max(...originalReturns);
  
  // Calculate annualized return differently based on data format
  let annualizedReturn;
  if (params.dataFormat === 'absolute') {
    // For absolute dollar values, use a simple yearly projection
    annualizedReturn = originalMeanReturn * params.tradingPeriods;
    
    console.log(`Absolute format annualized return calculation:
      Mean return per period: $${originalMeanReturn}
      Trading periods per year: ${params.tradingPeriods}
      Simple annualization formula: $${originalMeanReturn} * ${params.tradingPeriods}
      Result: $${annualizedReturn}`);
  } else {
    // For percentage/decimal returns, use the compound interest formula
    try {
      // Apply standard compound interest formula
      annualizedReturn = Math.pow(1 + originalMeanReturn, params.tradingPeriods) - 1;
      
      // Debug logging 
      console.log(`Percentage/decimal annualized return: 
        Base: (1 + ${originalMeanReturn})
        Exponent: ${params.tradingPeriods}
        Formula: (1 + ${originalMeanReturn})^${params.tradingPeriods} - 1
        Result: ${annualizedReturn}
        As percentage: ${annualizedReturn * 100}%`);
      
    } catch (error) {
      // Fallback to simple multiplication if math error occurs
      console.warn("Error calculating annualized return using compound formula, falling back to simple approach");
      annualizedReturn = originalMeanReturn * params.tradingPeriods;
    }
  }
  
  // Log the final results
  console.log('Final calculation results:', {
    sharpeRatio,
    sortinoRatio,
    meanReturn: originalMeanReturn, // Report the original mean for UI consistency
    stdDeviation,
    downsideDeviation,
    totalReturns: originalReturns.length,
    positiveReturns,
    negativeReturns,
    minReturn,
    maxReturn,
    annualizedReturn,
  });

  return {
    sharpeRatio,
    sortinoRatio,
    meanReturn: originalMeanReturn, // Report the original mean for UI consistency
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

export const formatNumber = (value: number, decimals: number = 4): string => {
  return value.toFixed(decimals);
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};
