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
}

const Results: React.FC<ResultsProps> = ({ result, returnValues, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');

  // Prepare chart data for returns distribution
  const prepareHistogramData = () => {
    // Create bins for the histogram
    const minReturn = Math.min(...returnValues);
    const maxReturn = Math.max(...returnValues);
    const range = maxReturn - minReturn;
    const binCount = Math.min(20, Math.ceil(Math.sqrt(returnValues.length)));
    const binWidth = range / binCount;
    
    const bins = Array(binCount).fill(0).map((_, i) => ({
      min: minReturn + i * binWidth,
      max: minReturn + (i + 1) * binWidth,
      count: 0,
      isNegative: (minReturn + i * binWidth) < 0
    }));
    
    // Count returns in each bin
    returnValues.forEach(val => {
      const binIndex = Math.min(
        binCount - 1, 
        Math.floor((val - minReturn) / binWidth)
      );
      bins[binIndex].count++;
    });
    
    return {
      labels: bins.map(bin => `${formatNumber(bin.min * 100, 2)}% to ${formatNumber(bin.max * 100, 2)}%`),
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

  const handleExport = () => {
    // Create CSV content
    const lines = [
      "Sharpe & Sortino Ratio Calculator Results",
      "","",
      "SUMMARY STATISTICS",
      `Total Data Points,${result.totalReturns}`,
      `Positive Returns,${result.positiveReturns}`,
      `Negative Returns,${result.negativeReturns}`,
      `Min Return,${formatPercent(result.minReturn)}`,
      `Max Return,${formatPercent(result.maxReturn)}`,
      `Mean Return (per period),${formatPercent(result.meanReturn)}`,
      `Annualized Return,${result.annualizedReturn.toFixed(2)}%`,
      `Standard Deviation,${formatPercent(result.stdDeviation)}`,
      `Downside Deviation,${formatPercent(result.downsideDeviation)}`,
      "","",
      "RATIO RESULTS",
      `Sharpe Ratio,${formatNumber(result.sharpeRatio, 4)}`,
      `Sortino Ratio,${formatNumber(result.sortinoRatio, 4)}`,
      "","",
      "RAW DATA",
      ...returnValues.map((val, i) => `${i+1},${formatNumber(val * 100, 6)}%`)
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
                  {formatNumber(result.sharpeRatio, 2)}
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
                    {formatPercent(result.meanReturn)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Standard Deviation:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatPercent(result.stdDeviation)}
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
                  {formatNumber(result.sortinoRatio, 2)}
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
                    {formatPercent(result.meanReturn)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Downside Deviation:</span>
                  <span className="font-medium text-foreground text-right">
                    {formatPercent(result.downsideDeviation)}
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
                  <span>Export</span>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mt-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="chart">Distribution</TabsTrigger>
                <TabsTrigger value="explanation">Methodology</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="pt-4">
            <TabsContent value="summary" className="mt-0">
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Return Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-card p-3 rounded-md shadow-subtle">
                      <div className="text-muted-foreground text-xs">Annualized Return</div>
                      <div className="text-lg font-semibold mt-1">
                        {result.annualizedReturn.toFixed(2)}%
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
                      <TableCell className="text-right font-medium">{formatPercent(result.meanReturn)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Standard Deviation</TableCell>
                      <TableCell className="text-right font-medium">{formatPercent(result.stdDeviation)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Downside Deviation</TableCell>
                      <TableCell className="text-right font-medium">{formatPercent(result.downsideDeviation)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Minimum Return</TableCell>
                      <TableCell className="text-right font-medium text-destructive">{formatPercent(result.minReturn)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maximum Return</TableCell>
                      <TableCell className="text-right font-medium text-success-DEFAULT">{formatPercent(result.maxReturn)}</TableCell>
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
                        Higher ratios indicate better risk-adjusted performance.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 rounded-md p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-highlight" />
                      Sharpe Ratio
                    </h4>
                    <p className="text-sm mb-3">
                      The Sharpe ratio divides the excess return over the risk-free rate by the standard deviation of returns.
                    </p>
                    <div className="bg-white p-3 rounded-md border text-sm font-mono">
                      Sharpe = (Mean Return - Risk Free Rate) / Standard Deviation × √(Trading Periods)
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 rounded-md p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-success" />
                      Sortino Ratio
                    </h4>
                    <p className="text-sm mb-3">
                      The Sortino ratio is similar to Sharpe but only considers downside risk (negative returns).
                    </p>
                    <div className="bg-white p-3 rounded-md border text-sm font-mono">
                      Sortino = (Mean Return - Risk Free Rate) / Downside Deviation × √(Trading Periods)
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Downside deviation only considers returns below the target (or risk-free rate if no target is specified).
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
                    <li>These ratios should be used as one of multiple metrics to evaluate performance</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
