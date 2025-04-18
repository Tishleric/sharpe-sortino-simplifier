# Active Context

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
We've been improving the reliability and transparency of the Sharpe & Sortino ratio calculator, focusing on:

1. **Debugging and fixing calculation issues** - We investigated why downside deviation sometimes appeared as "0.00" in the UI and determined it was due to rounding precision (values like 0.0042 displaying as 0.00 with 2 decimal places).

2. **Enhancing Excel exports** - We've completely redesigned the Excel export functionality to provide a proper audit trail of all calculations:
   - Added "Inputs & Summary", "Breakdown", and "Methodology" sheets
   - Implemented live formula cells referencing raw data and parameters
   - Fixed sheet name quoting in Excel formulas
   - Ensured target return defaults to 0 if not specified to prevent formula errors
   - Created a professional layout that makes calculations fully transparent and verifiable

3. **Improving chart reliability** - Modified histogram binning logic to ensure no bin overlaps zero, giving a clearer picture of positive vs. negative returns.

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
- Perform thorough testing with diverse datasets
- Consider any UI improvements based on user feedback
- Document the methodology and calculation precision improvements

## Open Questions
- Should the application support more complex portfolio analysis?
- Would users benefit from saving/loading calculation configurations?
- Is there a need for additional educational content about financial metrics?
- Would adding benchmark comparison features be valuable? 