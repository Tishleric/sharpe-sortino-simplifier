import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Download, Info, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CalculationResult, formatNumber, formatPercent } from '@/utils/calculationUtils';
import { CalculationParams } from '@/utils/calculationUtils';
import { exportAnalysisToXLSX } from '@/utils/exportUtils';
import { Separator } from '@/components/ui/separator';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsProps {
  result: CalculationResult;
  returnValues: number[];
  onReset: () => void;
  dataFormat: string;
  params: CalculationParams;
}

const Results: React.FC<ResultsProps> = ({ result, returnValues, onReset, dataFormat, params }) => {
  const [activeTab, setActiveTab] = useState('summary');

  // Format value based on data format
  const formatValue = (value: number, decimals: number = 4): string => {
    if (dataFormat === 'absolute') {
      // For absolute values, just show the number with fixed decimals
      return value.toFixed(decimals);
    }
    // For percentages or decimals, use formatPercent
    return formatPercent(value);
  };

  // Format label for display
  const formatValueLabel = (value: number, decimals: number = 2): string => {
    if (dataFormat === 'absolute') {
      // For absolute values, don't show percentage sign
      return `$${value.toFixed(decimals)}`;
    }
    // For percentages or decimals, use formatPercent
    return formatPercent(value);
  };

  // Format ratio (Sharpe, Sortino) as dimensionless number
  const formatRatio = (value: number, decimals: number = 4): string => {
    // Ratios should always be displayed as dimensionless numbers
    // without percentage signs or other modifications
    return value.toFixed(decimals);
  };

  // Format annualized return
  const formatAnnualizedReturn = (value: number, decimals: number = 2): string => {
    // First ensure the value is a valid number and not NaN or Infinity
    const validValue = isFinite(value) ? value : 0;
    
    if (dataFormat === 'absolute') {
      // For absolute values, format as currency with fixed decimals
      return `$${validValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}`;
    }
    
    // For percentages or decimals, show with % sign
    // The annualized return calculation gives us a decimal value (e.g., 3.5845 = 358.45%)
    // We multiply by 100 to convert to percentage representation
    return `${(validValue * 100).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}%`;
  };

  // Prepare chart data for returns distribution
  const prepareHistogramData = () => {
    // Create bins for the histogram
    const minReturn = Math.min(...returnValues);
    const maxReturn = Math.max(...returnValues);
    let bins = [];
    // If min and max are both on the same side of zero, use default binning
    if (minReturn >= 0 || maxReturn <= 0) {
      const range = maxReturn - minReturn;
      const binCount = Math.min(20, Math.ceil(Math.sqrt(returnValues.length)));
      const binWidth = range / binCount;
      bins = Array(binCount).fill(0).map((_, i) => ({
        min: minReturn + i * binWidth,
        max: minReturn + (i + 1) * binWidth,
        count: 0,
        isNegative: (minReturn + i * binWidth) < 0
      }));
    } else {
      // Split at zero: negative bins up to 0, positive bins from 0
      const negRange = 0 - minReturn;
      const posRange = maxReturn - 0;
      const totalRange = maxReturn - minReturn;
      const binCount = Math.min(20, Math.ceil(Math.sqrt(returnValues.length)));
      // Proportionally allocate bins
      const negBins = Math.max(1, Math.round(binCount * (negRange / totalRange)));
      const posBins = binCount - negBins;
      const negBinWidth = negRange / negBins;
      const posBinWidth = posRange / Math.max(1, posBins);
      // Negative bins
      for (let i = 0; i < negBins; i++) {
        bins.push({
          min: minReturn + i * negBinWidth,
          max: minReturn + (i + 1) * negBinWidth,
          count: 0,
          isNegative: true
        });
      }
      // Positive bins
      for (let i = 0; i < posBins; i++) {
        bins.push({
          min: 0 + i * posBinWidth,
          max: 0 + (i + 1) * posBinWidth,
          count: 0,
          isNegative: false
        });
      }
    }
    // Count returns in each bin
    returnValues.forEach(val => {
      const binIndex = bins.findIndex(bin => val >= bin.min && val < bin.max);
      if (binIndex !== -1) {
        bins[binIndex].count++;
      } else if (val === maxReturn) {
        bins[bins.length - 1].count++;
      }
    });
    return {
      labels: bins.map(bin => {
        if (dataFormat === 'absolute') {
          return `$${bin.min.toFixed(2)} to $${bin.max.toFixed(2)}`;
        }
        return `${formatNumber(bin.min * 100, 2)}% to ${formatNumber(bin.max * 100, 2)}%`;
      }),
      datasets: [
        {
          label: 'Return Distribution',
          data: bins.map(bin => bin.count),
          backgroundColor: bins.map(bin => bin.isNegative ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)'),
          borderColor: bins.map(bin => bin.isNegative ? 'rgb(220, 38, 38)' : 'rgb(22, 163, 74)'),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Count: ${context.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Frequency',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Return Range',
        },
      },
    },
  };

  // Export to Excel (XLSX)
  const handleExportExcel = () => {
    exportAnalysisToXLSX(result, returnValues, params);
  };

  const handleExport = () => {
    // Create CSV content
    const lines = [
      "Sharpe & Sortino Ratio Calculator Results",
      "","",
      "SUMMARY STATISTICS",
      `Total Data Points,${result.totalReturns}`,
      `Positive Returns,${result.positiveReturns}`,
      `Negative Returns,${result.negativeReturns}`,
      `Min Return,${formatValue(result.minReturn)}`,
      `Max Return,${formatValue(result.maxReturn)}`,
      `Mean Return (per period),${formatPercent(result.meanReturn, 2)}`,
      `Annualized Return,${formatPercent(result.annualizedReturn, 2)}`,
      `Standard Deviation,${formatValue(result.stdDeviation)}`,
      `Downside Deviation,${formatValue(result.downsideDeviation)}`,
      `Geometric Mean (CAGR base),${formatPercent(result.geoMean, 2)}`,
      "","",
      "RATIO RESULTS",
      `Sharpe Ratio,${formatRatio(result.sharpeRatio, 4)}`,
      `Sortino Ratio,${formatRatio(result.sortinoRatio, 4)}`,
      "","",
      "RAW DATA",
      ...returnValues.map((val, i) => {
        if (dataFormat === 'absolute') {
          return `${i+1},${val.toFixed(6)}`;
        }
        return `${i+1},${formatNumber(val * 100, 6)}%`;
      })
    ];
    
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set link properties
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `sharpe-sortino-results-${date}.csv`);
    
    // Append, click and remove link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
      <div className="grid gap-6">
        {/* Ratio Results Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="overflow-hidden border-t-4 border-t-highlight shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Sharpe Ratio
                <span className="text-3xl font-bold ml-auto">
                  {formatRatio(result.sharpeRatio, 2)}
                </span>
              </CardTitle>
              <CardDescription>
                Risk-adjusted return using standard deviation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Mean Return:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatPercent(result.meanReturn, 2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Standard Deviation:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatValue(result.stdDeviation)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-t-4 border-t-success shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Sortino Ratio
                <span className="text-3xl font-bold ml-auto">
                  {formatRatio(result.sortinoRatio, 2)}
                </span>
              </CardTitle>
              <CardDescription>
                Risk-adjusted return using downside deviation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <span>Mean Return:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatPercent(result.meanReturn, 2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Downside Deviation:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatValue(result.downsideDeviation)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Results Tabs */}
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Detailed Results</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportExcel}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Export XLSX</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onReset}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>New Analysis</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="chart">Distribution</TabsTrigger>
                <TabsTrigger value="explanation">Methodology</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Return Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-card p-3 rounded-md shadow-subtle">
                        <div className="text-muted-foreground text-xs">Annualized Return</div>
                        <div className="text-lg font-semibold mt-1">
                          {formatPercent(result.annualizedReturn, 2)}
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-md shadow-subtle">
                        <div className="text-muted-foreground text-xs">Total Data Points</div>
                        <div className="text-lg font-semibold mt-1">
                          {result.totalReturns}
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-md shadow-subtle">
                        <div className="text-muted-foreground text-xs">Positive Returns</div>
                        <div className="text-lg font-semibold mt-1 text-success-DEFAULT">
                          {result.positiveReturns}
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-md shadow-subtle">
                        <div className="text-muted-foreground text-xs">Negative Returns</div>
                        <div className="text-lg font-semibold mt-1 text-destructive">
                          {result.negativeReturns}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Mean Return (per period)</TableCell>
                        <TableCell className="text-right font-medium">{formatPercent(result.meanReturn, 2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Geometric Mean (CAGR base)</TableCell>
                        <TableCell className="text-right font-medium">{formatPercent(result.geoMean, 2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Standard Deviation</TableCell>
                        <TableCell className="text-right font-medium">{formatValue(result.stdDeviation)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Downside Deviation</TableCell>
                        <TableCell className="text-right font-medium">{formatValue(result.downsideDeviation)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Minimum Return</TableCell>
                        <TableCell className="text-right font-medium text-destructive">{formatValue(result.minReturn)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maximum Return</TableCell>
                        <TableCell className="text-right font-medium text-success-DEFAULT">{formatValue(result.maxReturn)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="chart" className="mt-0">
                <div className="h-[300px] bg-white p-4 rounded-md shadow-subtle">
                  <Bar data={prepareHistogramData()} options={chartOptions} />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs">Negative Returns</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs">Positive Returns</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="explanation" className="mt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-accent rounded-full mt-1">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">About The Calculation</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          These ratios help compare investment returns on a risk-adjusted basis.
                          Higher ratios indicate better risk-adjusted performance. All calculations are annualized for consistency.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/40 rounded-md p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-highlight" />
                        Sharpe Ratio
                      </h4>
                      <p className="text-sm mb-3">
                        The Sharpe ratio measures the excess return per unit of total risk, using the sample standard deviation to account for variability in returns.
                      </p>
                      <div className="bg-white p-3 rounded-md border text-sm font-mono">
                        Sharpe = (Mean Return - Risk Free Rate) / Standard Deviation × √(Trading Periods)
                      </div>
                      <p className="text-sm mt-2">
                        Where:
                        <ul className="list-disc pl-5 mt-1">
                          <li><strong>Mean Return</strong>: Average of periodic returns (e.g., daily or monthly)</li>
                          <li><strong>Risk Free Rate</strong>: Periodic risk-free rate, derived from the annual rate</li>
                          <li><strong>Standard Deviation</strong>: Sample standard deviation (n-1 denominator) of periodic returns</li>
                          <li><strong>Trading Periods</strong>: Number of periods per year (e.g., 252 for daily) for annualization</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-muted/40 rounded-md p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-success" />
                        Sortino Ratio
                      </h4>
                      <p className="text-sm mb-3">
                        The Sortino ratio refines the Sharpe ratio by focusing solely on downside risk, penalizing only negative deviations from the target return.
                      </p>
                      <div className="bg-white p-3 rounded-md border text-sm font-mono">
                        Sortino = (Mean Return - Risk Free Rate) / Downside Deviation × √(Trading Periods)
                      </div>
                      <p className="text-sm mt-2">
                        Where:
                        <ul className="list-disc pl-5 mt-1">
                          <li><strong>Downside Deviation</strong>: Sample standard deviation of returns below the target return (or risk-free rate if unspecified), considering only negative deviations</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-muted/40 rounded-md p-4">
                      <h4 className="font-medium mb-2">Data Format Handling</h4>
                      <p className="text-sm mb-3">
                        The software supports multiple return formats, processed as follows:
                      </p>
                      <ul className="list-disc pl-5 text-sm">
                        <li><strong>Percentage</strong>: Values like 5 are treated as 5% (divided by 100)</li>
                        <li><strong>Decimal</strong>: Values like 0.05 are treated as 5%</li>
                        <li><strong>Absolute</strong>: Dollar amounts (PnL); if a starting portfolio value is provided, percentage returns are computed dynamically by updating the portfolio value each period</li>
                        <li><strong>Auto</strong>: Format is inferred from data magnitude</li>
                      </ul>
                      <p className="text-sm mt-2">
                        For absolute returns without a portfolio value, ratios are calculated directly, but results may not align with standard benchmarks.
                      </p>
                    </div>
                    
                    <div className="bg-muted/40 rounded-md p-4">
                      <h4 className="font-medium mb-2">Risk-Free Rate Conversion</h4>
                      <p className="text-sm mb-3">
                        The annual risk-free rate is adjusted to match the periodicity of returns:
                      </p>
                      <div className="bg-white p-3 rounded-md border text-sm font-mono">
                        Periodic Rate = (1 + Annual Rate)^(1 / Trading Periods) - 1
                      </div>
                      <p className="text-sm mt-2">
                        This ensures the risk-free rate aligns with the return intervals (e.g., daily, monthly).
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Interpreting Results</h4>
                    <ul className="space-y-2 text-sm list-disc pl-5">
                      <li>A higher ratio indicates better risk-adjusted returns</li>
                      <li>Generally, a Sharpe ratio above 1.0 is considered acceptable</li>
                      <li>A ratio above 2.0 is considered very good</li>
                      <li>Sortino ratios tend to be higher than Sharpe when losses are infrequent</li>
                      <li>These ratios should be used alongside other metrics to evaluate performance</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
