/**
 * Test Validation Script for Sharpe-Sortino Calculator
 * 
 * How to use:
 * 1. Open the browser console after running the app
 * 2. Copy and paste this entire script into the console
 * 3. Upload one of the test CSV files and select the appropriate format
 * 4. After results are shown, run validateResults('percentage') or whichever format you're testing
 */

// Store the expected solutions
const solutions = {
  percentage: {
    meanReturn: 2.35,
    stdDeviation: 2.36,
    downsideDeviation: 1.77,
    minReturn: -2.0,
    maxReturn: 5.0,
    positiveReturns: 8,
    negativeReturns: 2,
    totalReturns: 10,
    sharpeRatio: 15.80,
    sortinoRatio: 21.10,
    annualizedReturn: 358.45,
    format: "percentage"
  },
  decimal: {
    meanReturn: 0.0235,
    stdDeviation: 0.0236,
    downsideDeviation: 0.0177,
    minReturn: -0.02,
    maxReturn: 0.05,
    positiveReturns: 8,
    negativeReturns: 2,
    totalReturns: 10,
    sharpeRatio: 15.80,
    sortinoRatio: 21.10,
    annualizedReturn: 3.5845,
    format: "decimal"
  },
  absolute: {
    meanReturn: 235.00,
    stdDeviation: 236.17,
    downsideDeviation: 176.78,
    minReturn: -200.00,
    maxReturn: 500.00,
    positiveReturns: 8,
    negativeReturns: 2,
    totalReturns: 10,
    sharpeRatio: 15.80,
    sortinoRatio: 21.10,
    annualizedReturn: 5920.00,
    format: "absolute"
  }
};

// General tolerance for floating point comparisons
// Use a percentage-based tolerance for large values (like annualized return in absolute mode)
const BASE_TOLERANCE = 0.1; // 0.1 difference for most metrics
const PERCENTAGE_TOLERANCE = 0.05; // 5% tolerance for larger values

// Especially large tolerance for annualized returns which can vary significantly
const ANNUALIZED_TOLERANCE = 5; // Allow 5% difference for annualized returns

// Check if two numbers are approximately equal
function isApproximatelyEqual(a, b, tolerance = BASE_TOLERANCE) {
  // For large values, use a percentage-based tolerance
  if (Math.abs(a) > 100 || Math.abs(b) > 100) {
    return Math.abs(a - b) <= Math.max(a, b) * PERCENTAGE_TOLERANCE;
  }
  // For smaller values, use the base tolerance
  return Math.abs(a - b) <= tolerance;
}

// Extract the numeric value from a formatted string
function extractNumber(str) {
  if (!str) return null;
  const matches = str.match(/-?[\d,.]+/);
  return matches ? parseFloat(matches[0].replace(/,/g, '')) : null;
}

// Main validation function
function validateResults(format) {
  if (!['percentage', 'decimal', 'absolute'].includes(format)) {
    console.error('Invalid format. Use "percentage", "decimal", or "absolute".');
    return;
  }

  const expected = solutions[format];
  
  // Try to get the result element by looking for common patterns 
  const resultContainer = document.querySelector('[class*="results"]') || 
                         document.querySelector('[class*="card"]') ||
                         document.querySelector('main');
  
  if (!resultContainer) {
    console.error('Results container not found. Make sure you have run the calculation first.');
    return;
  }
  
  console.log("Attempting to extract values from the DOM...");
  
  // Simple text extractor with fallbacks
  function extractTextValue(selector) {
    try {
      // Try different query strategies
      const elements = [
        ...document.querySelectorAll(selector),
        ...document.querySelectorAll(`*:contains("${selector.replace(/[^\w\s]/g, '')}")`)
      ];
      
      for (const el of elements) {
        if (el && el.textContent) {
          const value = extractNumber(el.textContent);
          if (value !== null) return value;
        }
      }
      return null;
    } catch (e) {
      console.warn(`Error extracting ${selector}:`, e);
      return null;
    }
  }
  
  // Extract metrics using various selector strategies
  const metrics = {
    // Try to find the main metrics
    sharpeRatio: extractNumber(document.querySelector('h1, h2, h3, [class*="title"]')?.textContent) || 
                 extractTextValue('Sharpe Ratio'),
    sortinoRatio: extractNumber(document.querySelectorAll('h1, h2, h3, [class*="title"]')[1]?.textContent) || 
                  extractTextValue('Sortino Ratio'),
    meanReturn: extractTextValue('Mean Return'),
    stdDeviation: extractTextValue('Standard Deviation'),
    downsideDeviation: extractTextValue('Downside Deviation'),
    minReturn: extractTextValue('Minimum Return'),
    maxReturn: extractTextValue('Maximum Return'),
    positiveReturns: extractTextValue('Positive Returns'),
    negativeReturns: extractTextValue('Negative Returns'),
    totalReturns: extractTextValue('Total Data Points'),
    annualizedReturn: extractTextValue('Annualized Return')
  };
  
  console.log(`Validating ${format} format results:`);
  console.log('Expected:', expected);
  console.log('Actual:', metrics);
  
  // Check each value
  let allCorrect = true;
  Object.keys(expected).forEach(key => {
    if (metrics[key] === null) {
      console.log(`${key}: ❓ Could not find actual value in UI`);
      allCorrect = false;
      return;
    }
    
    // Use a higher tolerance for annualized returns
    const tolerance = key === 'annualizedReturn' ? ANNUALIZED_TOLERANCE : BASE_TOLERANCE;
    const isCorrect = isApproximatelyEqual(expected[key], metrics[key], tolerance);
    console.log(`${key}: ${isCorrect ? '✅' : '❌'} Expected: ${expected[key]}, Actual: ${metrics[key]}`);
    if (!isCorrect) allCorrect = false;
  });
  
  console.log(`Overall validation: ${allCorrect ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Return validation status and details
  return {
    passed: allCorrect,
    expected,
    actual: metrics,
    differences: Object.keys(expected).reduce((diff, key) => {
      if (metrics[key] === null) {
        diff[key] = { error: 'Value not found in UI' };
        return diff;
      }
      
      diff[key] = {
        expected: expected[key],
        actual: metrics[key],
        difference: metrics[key] - expected[key],
        percentDifference: ((metrics[key] - expected[key]) / expected[key]) * 100,
        passed: isApproximatelyEqual(expected[key], metrics[key])
      };
      return diff;
    }, {})
  };
}

// Announce that the validation script is ready
console.log('Validation script loaded. Use validateResults("percentage"), validateResults("decimal"), or validateResults("absolute") to test results.'); 