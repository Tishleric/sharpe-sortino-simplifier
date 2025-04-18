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
- Documenting the project's architecture and functionality
- Maintaining mathematical accuracy and transparency in calculations
- Ensuring the user interface is intuitive and responsive

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

## Next Steps
- Gather user feedback on calculation methodology and interface
- Consider potential enhancements:
  - Support for more complex return series (irregular intervals)
  - Addition of other risk-adjusted metrics (e.g., Calmar ratio, Omega ratio)
  - Comparative analysis features for multiple data series
  - Enhanced visualization options

## Open Questions
- Should the application support more complex portfolio analysis?
- Would users benefit from saving/loading calculation configurations?
- Is there a need for additional educational content about financial metrics?
- Would adding benchmark comparison features be valuable? 