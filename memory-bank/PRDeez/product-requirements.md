# Sharpe & Sortino Ratio Calculator - Product Requirements Document

## Sprint-01 – Accuracy & UX polish (2025-04-18)

This sprint introduces the following requirements, which supersede or extend previous requirements where relevant:

### A. Math engine correctness
- Use geometric mean (CAGR) for annualisation instead of arithmetic mean
- Downside deviation must use (m-1) denominator
- All calculations must use fractional returns; block calculation if portfolioValue is missing and dataFormat is 'absolute'
- Result object must expose sharpeSE (standard error) and excessReturn

### B. Results display
- All numbers must display with 2 decimal places; show % whenever |value| < 1
- Under Sharpe, display "± SE" in smaller grey text
- Hide annualisation toggle (assume sub-annual data)

### C. Rolling statistics
- Compute 30/60/90-day rolling Sharpe ratios
- Display a Plotly chart (3 traces, Tailwind themed) in a new Accordion section "Rolling Performance" at the bottom of the Results page

### D. Data preview improvements
- Preview table must be scrollable (max-h-64, overflow-auto)
- Add a "Mark last row as footer" toggle; excluded row must not enter calculations or exports

### E. Excel export overhaul
- Sheet 1: Raw data + live-formula columns (geometric mean, σ, downside σ, Sharpe, Sortino, SE)
- Sheet 2: Static copy of app results, step-by-step with brief comments
- All cells formatted to 2 decimal places (% where appropriate)
- Risk-free cell must default to 0 if left blank

### F. Formatting & housekeeping
- Remove unused props/imports
- Update test-data JSON gold-sets to match new engine

## 1. Product Overview

### 1.1 Product Purpose
The Sharpe & Sortino Ratio Calculator is a web application designed to provide financial professionals, traders, and investors with a simple yet powerful tool to calculate risk-adjusted performance metrics. By uploading return data, users can quickly obtain professionally calculated Sharpe and Sortino ratios along with supporting statistics and visualizations.

### 1.2 Target Audience
- Financial analysts and portfolio managers
- Traders evaluating strategy performance
- Investment researchers
- Finance students and educators
- Individual investors analyzing their portfolios

### 1.3 Key Value Propositions
- **Transparency**: Clear methodology and intermediate calculations
- **Flexibility**: Support for multiple data formats
- **Education**: Built-in explanations and interpretation guidance
- **Simplicity**: Intuitive three-step process
- **Privacy**: Client-side processing without data transfer

## 2. User Stories

### 2.1 Core User Stories

1. **Data Upload**
   - As a user, I want to upload my returns data file so that I can analyze its risk-adjusted performance.
   - Acceptance Criteria:
     - Support for CSV, Excel, and TSV files
     - Drag-and-drop functionality
     - File type validation
     - Clear error messages for invalid files
     - Preview of uploaded data

2. **Data Configuration**
   - As a user, I want to select which column contains my returns and configure calculation parameters so that the analysis is tailored to my specific data.
   - Acceptance Criteria:
     - Column selection from available data
     - Configuration for risk-free rate
     - Selection of trading periods per year
     - Option to set target return
     - Data format selection (percentage, decimal, absolute)
     - Portfolio value input for absolute returns

3. **Results View**
   - As a user, I want to see clearly presented Sharpe and Sortino ratios along with supporting statistics so that I can understand my risk-adjusted performance.
   - Acceptance Criteria:
     - Prominently displayed ratio values
     - Summary statistics (mean return, standard deviation, etc.)
     - Return distribution visualization
     - Clear formatting appropriate to data type
     - Export functionality for further analysis

4. **Educational Content**
   - As a user, I want to understand the methodology and interpretation of the ratios so that I can make informed decisions.
   - Acceptance Criteria:
     - Clear explanations of each ratio
     - Formula presentation
     - Interpretation guidance
     - Methodology details
     - Data format handling explanation

## 3. Functional Requirements

### 3.1 File Upload and Parsing
- Accept CSV, XLSX, XLS, and TSV files
- Parse files to extract headers and data
- Handle Excel date formats appropriately
- Provide data preview
- Validate file contents for usable numeric data

### 3.2 Data Configuration
- Allow selection of returns column
- Provide input for risk-free rate (annual)
- Provide input for trading periods per year
- Optional target return input
- Data format selection (auto, percentage, decimal, absolute)
- Portfolio value input for absolute returns

### 3.3 Calculation Engine
- Calculate Sharpe ratio using industry-standard methodology
- Calculate Sortino ratio using downside deviation
- Convert risk-free rate to per-period rate using compound formula
- Use sample standard deviation (n-1) for more conservative estimates
- Calculate downside deviation using negative deviations only
- Handle edge cases (zero standard deviation, insufficient data)
- Support different data formats with appropriate conversions
- Apply appropriate annualization factor

### 3.4 Results Display
- Show calculated Sharpe and Sortino ratios
- Display supporting statistics:
  - Mean return
  - Standard deviation
  - Downside deviation
  - Number of returns (total, positive, negative)
  - Minimum and maximum returns
  - Annualized return
- Provide return distribution histogram
- Format results appropriately for data type
- Support CSV export of results and raw data

### 3.5 Educational Content
- Explain Sharpe ratio methodology and interpretation
- Explain Sortino ratio methodology and interpretation
- Describe data format handling
- Provide guidance on ratio interpretation

## 4. Non-Functional Requirements

### 4.1 Performance
- Handle files up to 10MB (approximately 50,000 data points)
- Render results within 3 seconds for typical datasets
- Maintain responsive UI during calculations

### 4.2 Usability
- Intuitive three-step workflow
- Clear visual progress indicators
- Responsive design for desktop and tablet devices
- Accessible for users with disabilities (WCAG AA compliance)
- Clear error messages and user guidance

### 4.3 Security and Privacy
- Client-side processing only
- No data transmission to servers
- No data persistence beyond current session

### 4.4 Browser Compatibility
- Support for modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum IE support

## 5. Future Considerations

### 5.1 Potential Enhancements
- Multiple data series comparison
- Benchmark comparison
- Additional risk metrics (Calmar, Omega, etc.)
- Configuration saving/loading
- Advanced data transformations
- Additional visualization options
- Mobile optimization
- Offline capabilities (PWA) 