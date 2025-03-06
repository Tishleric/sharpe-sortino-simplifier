# Note for Das

This application is designed to calculate Sharpe and Sortino ratios from uploaded spreadsheet data (PnL/returns), providing users with a clear, transparent view of risk-adjusted performance. Users can upload their data, select relevant columns, and specify calculation parameters to obtain precise risk-adjusted performance metrics.

## Key Mathematical Decisions

- **Risk-Free Rate Conversion**: The annual risk-free rate is converted to a per-period rate using the compound interest formula: periodic rate = (1 + annual rate/100)^(1/trading periods) - 1. This ensures an accurate conversion over time periods rather than a simple division.

- **Standard Deviation Choice**: We use the sample standard deviation (n-1) to provide a more conservative estimate of volatility for sample data. This approach is generally accepted in financial statistics, especially with smaller datasets.

- **Downside Deviation Calculation**: For the Sortino ratio, the downside deviation is calculated by dividing the downside variance by the number of negative deviations rather than the total sample size. This method was selected to provide a more accurate assessment of downside risk, resulting in a more conservative Sortino ratio.

- **Data Format Handling**: The app includes explicit data format selection to correctly interpret input returns as either percentages, decimals, or absolute dollar values:
  - **Auto-detect**: Automatically determines if values are percentages or decimals based on the data range.
  - **Percentage**: Values like 5 are interpreted as 5% (converted to 0.05 for calculations).
  - **Decimal**: Values like 0.05 are used directly as 5% in decimal form.
  - **Absolute ($)**: Values represent absolute dollar amounts (e.g., $33,379) and are used directly without conversion to percentage returns. This is intended for cases where the PnL is provided in absolute terms rather than as a percentage or decimal return.

- **Annualization Factor**: The annualization factor (√trading periods) is applied uniformly to both Sharpe and Sortino ratios, following standard financial practice for converting period-specific metrics to annual terms.

These methodological choices were made to maximize accuracy and transparency in the ratio calculations. Any variations in methodology (e.g., different approaches to calculating downside deviation) are documented to allow for future adjustments based on user feedback and specific use cases.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9884fe4b-dd51-4230-a806-afb9fb66ea0f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9884fe4b-dd51-4230-a806-afb9fb66ea0f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9884fe4b-dd51-4230-a806-afb9fb66ea0f) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
