# Technical Context

## Sprint-01 – Accuracy & UX polish (2025-04-18)

This sprint introduces the following new technical requirements, which extend or override previous technical context where relevant:

- **Plotly.js Integration**: Plotly.js is now required for rolling Sharpe chart visualization (in addition to Chart.js for histograms).
- **Number Formatting**: All displayed numbers must use 2 decimal places, and show % whenever |value| < 1.
- **Excel Export Logic**: Exports now include live-formula columns, static results, 2 dp formatting, and risk-free cell defaulting to 0 if blank.
- **Fractional Returns Enforcement**: All calculations require fractional returns; calculations are blocked if portfolioValue is missing and dataFormat is 'absolute'.

## Technology Stack

The Sharpe Sortino Simplifier is built with a modern frontend technology stack:

### Core Framework
- **Vite**: Fast, modern frontend build tool and development server
- **React**: Component-based UI library
- **TypeScript**: Static typing for JavaScript to enhance code reliability

### UI Components and Styling
- **shadcn/ui**: Reusable UI component collection based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for minimal, consistent iconography

### Data Handling and Visualization
- **XLSX.js**: Spreadsheet parsing library for CSV, XLS, and XLSX files
- **Chart.js / React-ChartJS-2**: Charting library for data visualization

### State Management and Routing
- **React useState/useEffect**: Hooks for component-level state management
- **React Router**: For client-side routing between pages

### Notifications and User Feedback
- **Sonner**: Toast notification system for user feedback
- **React Toaster**: Additional toast notification provider

## Development Environment

### Build Tools
- **Node.js**: JavaScript runtime
- **npm/bun**: Package managers for dependency management
- **TypeScript**: Configuration for type checking
- **ESLint**: Code linting for maintaining code quality
- **Vite**: Development server and build tool

### Debugging Tools
- **Browser DevTools**: Used for runtime debugging and performance analysis
- **TypeScript Language Service**: For type checking and code navigation
- **Vite Error Overlay**: For error reporting during development

## Deployment

### Build Process
- **Vite Build**: Produces optimized static assets
- **TypeScript Compilation**: Transpiles TypeScript to JavaScript
- **Bundle Optimization**: Includes code splitting and tree shaking

### Hosting
- **Static Hosting**: Any static web hosting service is suitable (Netlify, Vercel, GitHub Pages)
- **No Backend Requirements**: The application runs entirely in the browser, with no server-side dependencies

## Technical Constraints

### Browser Compatibility
- Modern browsers with ES6 support
- Chrome, Firefox, Safari, Edge (latest versions)

### Performance Considerations
- Handles large spreadsheet files (up to several MB) on the client side
- Chart rendering performance for large datasets

### Security
- All processing happens client-side (no data is transmitted to servers)
- No server API dependencies
- No user data persistence (session only)

## Dependencies

### Core Dependencies
```
"react": "^18.3.1",
"react-dom": "^18.3.1",
"react-router-dom": "^6.26.2",
"typescript": "^5.5.3",
"vite": "^5.4.1"
```

### UI Dependencies
```
"@radix-ui/react-*": Various Radix UI components
"shadcn/ui": Custom component library (not directly in package.json)
"lucide-react": "^0.462.0",
"tailwindcss": "^3.4.11",
"tailwindcss-animate": "^1.0.7"
```

### Data Processing
```
"xlsx": "^0.18.5",
"chart.js": "^4.4.8",
"react-chartjs-2": "^5.3.0"
```

## Configuration Files

- **tsconfig.json**: TypeScript configuration
- **vite.config.ts**: Vite build and development configuration
- **tailwind.config.ts**: Tailwind CSS theme and plugin configuration
- **eslint.config.js**: ESLint rules for code quality
- **postcss.config.js**: PostCSS configuration for Tailwind 