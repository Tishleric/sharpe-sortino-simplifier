# Infrastructure Walkthrough

## 1. Project Overview
- Purpose: Sharpe & Sortino Ratio Calculator for periodic returns or PnL data
- Three-step UX Flow: 1) Upload → 2) Configure → 3) Results
- Tech Stack: Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Sonner toasts

## 2. Core Modules & Structure

### File Parsing (`src/utils/fileUtils.ts`)
- Supports CSV, XLSX, TSB formats
- `parseFile` uses XLSX.js to extract headers & rows
- `cleanNumericValue` normalizes currencies, commas, parentheses
- `extractValidNumbers` auto-detects percent/decimal/absolute or honors explicit format
- Excel date detection & formatting (35000–60000 serial range)

### Calculation Engine (`src/utils/calculationUtils.ts`)
- Inputs: numeric returns array + { riskFreeRate, tradingPeriods, targetReturn?, dataFormat, portfolioValue? }
- Absolute → fractional conversion when `portfolioValue` provided
- Periodic risk‑free & target return:  
  `periodicRate = (1 + annualPct)^(1/N) - 1`
- Mean return & sample standard deviation (n-1 denominator)
- Downside deviation: squared gap below target, √(Σ gap² / m)
- Sharpe & Sortino ratios:  
  `(mean - rf) / deviation * √N` with ε protection
- Annualized return:  
  - Absolute: `mean$ * N`  
  - Percent/decimal: `(1 + mean)^N - 1`

### UI & Pages (`src/pages/Index.tsx` + components)
- `Index.tsx`: orchestrates wizard state (UPLOAD, PREVIEW, RESULTS)
- **Upload**: `FileUpload` → `parseFile` → `ParsedData`
- **Configure**: `DataPreview` → display sample rows, select column, set params → validate & extract values
- **Results**: `Results` component shows ratios, statistics table & CSV export

## 3. Data Flow & UX Patterns
- State managed via React `useState` in Index
- Toast notifications for errors/success (Sonner)
- CSV download built by generating CSV string in Results
- Responsive & accessible UI via shadcn/ui components and Tailwind

## 4. Considerations & Potential Fixes
- **Target Return Conversion**: respect `dataFormat==='decimal'` to avoid double `/100` on 0.05 inputs
- **Zero-volatility Ratios**: return `Infinity` or explicit `null` instead of silent `0` when σ≈0
- **Mean Naming Clarity**: differentiate processed mean vs raw mean in returned object (rename or expose both)
- **Loading State Cleanup**: reset `isLoading` before navigating away or guard unmounted component to prevent React warnings
- **Console Logging**: wrap debug logs behind `NODE_ENV !== 'production'` or remove for production builds
- **Minimum Data Points**: consider lowering threshold below 10 and add "low-sample" warning instead of blocking
- **Format Auto-detection**: edge-case data could mis-classify; improve heuristics or prominently show & let user override
- **Downside Deviation Denominator**: clarify divide-by-`m` vs divide-by-`n`; document choice or make configurable 