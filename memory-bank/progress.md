# Project Progress

## Sprint-01 – Accuracy & UX polish (2025-04-18)

**In Progress:**
- Math engine: Replace arithmetic-mean annualisation with geometric mean (CAGR)
- Math engine: Downside deviation uses (m-1) denominator
- Math engine: Force fractional returns; block calc if portfolioValue missing for absolute data
- Math engine: Expose sharpeSE and excessReturn in results
- Results: All numbers 2 dp; show % if |value| < 1
- Results: Under Sharpe add “± SE” in smaller grey text
- Results: Hide annualisation toggle (assume sub-annual data)
- Rolling stats: Compute 30/60/90-day rolling Sharpe
- Rolling stats: Plotly chart (3 traces), Tailwind themed, in Results Accordion
- Data preview: Make table scrollable (max-h-64, overflow-auto)
- Data preview: Add “Mark last row as footer” toggle (excluded from calcs/exports)
- Excel export: Sheet 1 = raw data + live-formula columns (geo mean, σ, downside σ, Sharpe, Sortino, SE)
- Excel export: Sheet 2 = static app results, step-by-step with comments
- Excel export: All cells 2 dp (% where appropriate)
- Excel export: Risk-free cell = 0 if blank
- Formatting: Remove unused props/imports
- Housekeeping: Update test-data JSON gold-sets to match new engine

## What Works

- **Core Functionality**
  - File upload and parsing (CSV, Excel)
  - Data format detection and conversion
  - Sharpe and Sortino ratio calculations
  - Display of results with 4 decimal precision
  - Distribution visualization
  - Data export (CSV and Excel)

- **User Interface**
  - Three-step workflow: Upload → Configure → Results
  - Data preview with column selection
  - Parameter configuration
  - Results dashboard with tabs

- **Recent Enhancements**
  - Excel export now includes:
    - Inputs & Summary sheet with raw/fractional returns and parameters
    - Detailed Breakdown sheet showing all calculation steps
    - Methodology explanation sheet
    - Live Excel formulas that reference cells, not hardcoded values
    - Properly quoted sheet names in formulas for Excel compatibility
  - Fixed display of small values (e.g., downside deviation) by increasing decimals from 2 to 4
  - Improved histogram binning by splitting at zero, ensuring bins are definitively positive or negative
  - Ensured target return parameter defaults to 0 in Excel to prevent formula errors

## What's Left to Build

Sprint-01 (see above) is the current focus. All other enhancements are deferred until this sprint is complete.

## Known Issues

- None currently—we've recently resolved:
  - Display issues with small decimal values
  - Excel formula errors with sheet name quoting
  - Histogram bin overlap at zero
  - Empty target return parameter causing Excel formula errors

## Technical Debt

- Consider updating the browserslist database (currently 7 months old)

## Complete Features

### Core Functionality
- ✅ File upload and parsing for CSV, Excel, and TSV formats
- ✅ Data preview with column selection
- ✅ Parameter configuration (risk-free rate, trading periods, etc.)
- ✅ Calculation of Sharpe and Sortino ratios
- ✅ Results display with summary statistics
- ✅ Return distribution visualization
- ✅ Results export to CSV
- ✅ Educational content on methodology and interpretation

### Technical Implementation
- ✅ Responsive UI using shadcn/ui components
- ✅ Error handling for file uploads and data parsing
- ✅ Support for different data formats (percentages, decimals, absolute)
- ✅ Auto-detection of data format
- ✅ Drag-and-drop file upload
- ✅ Chart.js integration for histograms
- ✅ Toast notifications for user feedback
- ✅ Clear navigation between application steps

## Potential Enhancements

### Feature Additions
- ⬜ Support for multiple data series comparison
- ⬜ Benchmark comparison functionality
- ⬜ Additional risk metrics (Calmar ratio, Omega ratio, etc.)
- ⬜ Configuration saving/loading
- ⬜ Advanced data transformations (rolling returns, resampling)
- ⬜ More visualization options (drawdown charts, rolling metrics)

### Technical Improvements
- ⬜ Performance optimization for very large datasets
- ⬜ Local storage for recent calculations
- ⬜ Improved mobile experience for complex charts
- ⬜ Offline support (PWA)
- ⬜ Support for direct API data sources
- ⬜ Unit and integration tests

## Current Status
The application is fully functional and ready for use. All core requirements have been implemented successfully, providing users with a complete tool for calculating and understanding risk-adjusted performance metrics.

The current version serves as a solid foundation for potential future enhancements while already delivering significant value through its transparent calculation methodology and educational content. 