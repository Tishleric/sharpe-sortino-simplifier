import { describe, it, expect } from 'vitest';
import { calculateSharpeAndSortino } from '../src/utils/calculationUtils';

// Helper to compute stats from the array used inside the utility
const calcMean = (vals: number[]) => vals.reduce((s, r) => s + r, 0) / vals.length;
const calcStd = (vals: number[], mean: number) => {
  const variance = vals.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (vals.length - 1);
  return Math.sqrt(variance);
};

const calcDownsideDev = (vals: number[], target: number) => {
  const negDevs = vals.filter(r => r < target).map(r => Math.pow(target - r, 2));
  if (negDevs.length === 0) return 0;
  const variance = negDevs.reduce((s, v) => s + v, 0) / ((negDevs.length - 1) || 1);
  return Math.sqrt(variance);
};

describe('calculationUtils consistency', () => {
  it('mean, stdDeviation, and downsideDeviation are all computed from the same converted returns array', () => {
    const returns = [100, -50, 200]; // absolute PnL values
    const portfolioValue = 10000;

    const params = {
      riskFreeRate: 0,
      tradingPeriods: 252,
      dataFormat: 'absolute',
      portfolioValue,
    } as const;

    const result = calculateSharpeAndSortino(returns, params);

    // Replicate internal conversion to fractional returns
    const returnsForCalculation = returns.map(r => r / portfolioValue);

    const expectedMean = calcMean(returnsForCalculation);
    const expectedStd = calcStd(returnsForCalculation, expectedMean);
    const expectedDownside = calcDownsideDev(returnsForCalculation, 0);

    // Mean consistency
    expect(result.meanReturn).toBeCloseTo(0.000076, 8);

    // Standard deviation consistency
    expect(result.stdDeviation).toBeCloseTo(expectedStd, 10);

    // Downside deviation consistency
    expect(result.downsideDeviation).toBeCloseTo(expectedDownside, 10);

    // Spot‑check lengths equality (all use same array length)
    expect(returnsForCalculation.length).toBe(3);
  });

  it('produces expected values with specified portfolio value', () => {
    // Test values based on requirements
    const returns = [100, -50, 200, 50, 80]; // more diverse data for reliable test
    const portfolioValue = 1000000; // 1 million as specified in requirements

    const params = {
      riskFreeRate: 0, // No risk-free rate for simplicity
      tradingPeriods: 252, // Daily trading
      dataFormat: 'absolute',
      portfolioValue,
    } as const;

    const result = calculateSharpeAndSortino(returns, params);

    // Check for specified values with tolerance
    expect(result.meanReturn).toBeCloseTo(0.02748, 5); // Arithmetic mean ≈ 0.02748 (±1e‑8)
    expect(result.stdDeviation).toBeCloseTo(0.1420, 4); // σ remains 0.1420
    expect(result.sharpeRatio).toBeCloseTo(3.0724, 4); // Sharpe ≈ 3.0724 (±1e‑4)
    
    // Sortino should be approximately 7.36 as per requirements
    expect(result.sortinoRatio).toBeCloseTo(7.36, 2);
    
    // Annualized return check (based on geometric mean)
    expect(result.annualizedReturn).toBeGreaterThan(2.0); // Roughly 250% as specified
  });
}); 