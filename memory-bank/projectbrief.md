# Sharpe & Sortino Ratio Calculator

## Project Purpose
A web application designed to calculate Sharpe and Sortino ratios from uploaded spreadsheet data (PnL/returns), providing users with a clear, transparent view of risk-adjusted performance metrics. Users can upload their data, select relevant columns, and specify calculation parameters to obtain precise risk-adjusted performance metrics.

## Key Requirements

### Core Functionality
- File upload for CSV, Excel, and TSV formats
- Data preview and configuration for calculation parameters
- Calculation of Sharpe and Sortino ratios with detailed results
- Visual representation of return distribution
- Export of calculation results
- Clear explanation of methodology and interpretation

### Quality Standards
- UI must be responsive and accessible across devices
- Features must handle errors gracefully (file validation, calculation edge cases)
- Code must follow TypeScript types and ES6+ standards
- Calculations must be mathematically accurate with transparent methodology
- Support for different data formats (percentages, decimals, absolute values)

## Technical Decisions

### Mathematical Methodology
- **Risk-Free Rate Conversion**: Annual risk-free rate is converted to per-period rate using compound interest formula
- **Standard Deviation Choice**: Sample standard deviation (n-1) is used for more conservative volatility estimates
- **Downside Deviation Calculation**: Calculated by dividing downside variance by number of negative deviations
- **Data Format Handling**: Auto-detection and explicit selection for percentages, decimals, or absolute values
- **Annualization Factor**: Applied uniformly to both ratios following standard financial practice

### Project Constraints
- Must maintain transparency in calculation methodology
- Must support various data formats common in financial analysis
- Must provide educational content for understanding ratio significance
- UI must be intuitive for financial professionals who may not be technical 