# Active Context

## Sprint-01 – Accuracy & UX polish (2025-04-18)

### A. Math engine correctness
- Replace arithmetic-mean annualisation with geometric mean (true CAGR).
- Downside deviation: use (m-1) denominator.
- Force fractional returns; block calc if portfolioValue missing when dataFormat = 'absolute'.
- Expose sharpeSE (standard error) and excessReturn in result object.

### B. Results display
- All numbers 2 dp; show % whenever |value| < 1.
- Under Sharpe add "± SE" in smaller grey text.
- Hide annualisation toggle (assume sub-annual data).

### C. Rolling statistics
- Compute 30/60/90-day rolling Sharpe.
- Plotly chart (3 traces) themed with Tailwind colours; embed at bottom of Results page inside new Accordion "Rolling Performance".

### D. Data preview improvements
- Make preview table scrollable (max-h-64) with overflow-auto.
- Add "Mark last row as footer" toggle; excluded row must not enter calculations or exports.

### E. Excel export overhaul
- Sheet 1: Raw data + live-formula columns (geometric mean, σ, downside σ, Sharpe, Sortino, SE).
- Sheet 2: Static copy of app results, laid out step-by-step with brief comments.
- All cells formatted 2 dp (% where appropriate).
- Put 0 in risk-free cell if user left it blank.

### F. Formatting & housekeeping
- Remove unused props/imports.
- Update test-data JSON gold-sets to match new engine.

## Current Status
The Sharpe & Sortino Ratio Calculator is a complete, functional application that successfully implements all core functionality. The application follows a three-step workflow:

1. **Upload**: Users upload CSV, Excel, or TSV files containing return data
2. **Configure**: Users select data columns and set calculation parameters
3. **Results**: The application displays calculation results, visualizations, and explanations

## Recent Changes
- Initial project setup with Vite, React, TypeScript, and shadcn/ui
- Implementation of file upload and parsing functionality
- Development of data preview and configuration interface
- Implementation of Sharpe and Sortino ratio calculations
- Creation of results visualization and export functionality
- Addition of educational content explaining the ratios and their interpretation

## Current Focus
Sprint-01 is now the immediate priority. All development is focused on implementing and verifying the changes outlined above to improve calculation accuracy, user experience, and export fidelity.

## Active Decisions and Considerations

### Mathematical Methodology
- Using compound interest formula for risk-free rate conversion rather than simple division
- Using sample standard deviation (n-1) as a more conservative volatility estimate
- Calculating downside deviation using only negative deviations for the Sortino ratio
- Supporting multiple data formats with auto-detection and explicit selection

### User Experience
- Maintaining a clear three-step process with visual indicators
- Providing comprehensive explanations of calculation methodology
- Including visual distribution charts for better data understanding
- Offering data export for further analysis

## Decisions and Considerations
- Mantained full transparency in calculations by providing both raw and processed data
- Used SheetJS capabilities to create a professional Excel export
- Avoided using data formats that don't work well across Excel/Google Sheets
- Focused on making the export a true audit/validation tool that matches UI calculations to the decimal

## Next Steps
- Implement Sprint-01 features as described above
- Thoroughly test all new and updated functionality
- Update documentation and gold-set test data to match new engine

## Open Questions
- Should the application support more complex portfolio analysis?
- Would users benefit from saving/loading calculation configurations?
- Is there a need for additional educational content about financial metrics?
- Would adding benchmark comparison features be valuable? 