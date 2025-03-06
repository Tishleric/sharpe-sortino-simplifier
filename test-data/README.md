# Test Data for Sharpe-Sortino Calculator

This directory contains test data and solutions to validate the Sharpe-Sortino calculator's functionality across different data formats.

## Test Files

### Input Files
- `test-percentage.csv`: Test data with returns in percentage format (e.g., 2.5%)
- `test-decimal.csv`: Test data with returns in decimal format (e.g., 0.025)
- `test-absolute.csv`: Test data with returns in absolute dollar values (e.g., $250)

### Solution Files
- `solution-percentage.json`: Expected calculation results for percentage data
- `solution-decimal.json`: Expected calculation results for decimal data
- `solution-absolute.json`: Expected calculation results for absolute dollar values

## How to Use

1. Upload the test CSV files to the application
2. Compare the calculated results against the expected values in the solution JSON files
3. Verify that the formatting is correct for the chosen data format:
   - Percentages should show with % sign
   - Ratios should be dimensionless (no % sign)
   - Absolute values should show with $ sign

## Validation Checklist

For each data format, verify:

- [ ] Mean return displays correctly
- [ ] Standard deviation displays correctly
- [ ] Annualized return calculation is correct
- [ ] Sharpe and Sortino ratios display as dimensionless numbers
- [ ] Minimum and maximum returns are correctly identified
- [ ] The data preview correctly shows the original data format

## Notes on Calculations

- The annualized return calculation differs between percentage/decimal format (compound formula) and absolute values (simple multiplication)
- All test data uses the same underlying values, just expressed in different formats
- Risk-free rate is assumed to be 0 for simplicity
- Trading periods is set to 252 (standard for daily data annualized to a year)

## Known Arithmetic

- For percentage/decimal data, we expect extremely high annualized returns due to the compound effect of the formula (1 + r)^252 - 1 when daily returns average 2.35%
- For large values, this is mathematically correct but may seem counterintuitive 