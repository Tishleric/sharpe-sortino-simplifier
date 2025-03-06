import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ParsedData, extractValidNumbers } from '@/utils/fileUtils';
import { CalculationParams } from '@/utils/calculationUtils';

interface DataPreviewProps {
  data: ParsedData;
  onProceed: (values: number[], params: CalculationParams, dataFormat: string) => void;
  onReset: () => void;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, onProceed, onReset }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [columnIndex, setColumnIndex] = useState<number>(-1);
  const [riskFreeRate, setRiskFreeRate] = useState<string>('0');
  const [tradingPeriods, setTradingPeriods] = useState<string>('252');
  const [targetReturn, setTargetReturn] = useState<string>('');
  const [portfolioValue, setPortfolioValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataFormat, setDataFormat] = useState<string>('auto');

  // Handle column selection
  const handleColumnSelect = (value: string) => {
    const index = data.headers.findIndex(h => h === value);
    setSelectedColumn(value);
    setColumnIndex(index);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (columnIndex === -1) {
      toast.error('Please select a column to analyze');
      return;
    }

    const riskFree = parseFloat(riskFreeRate);
    const periods = parseInt(tradingPeriods);
    const target = targetReturn ? parseFloat(targetReturn) : undefined;
    const portfolio = portfolioValue ? parseFloat(portfolioValue) : undefined;

    if (isNaN(riskFree) || isNaN(periods) || (targetReturn && isNaN(target)) || (portfolioValue && isNaN(portfolio))) {
      toast.error('Please enter valid numbers for all fields');
      return;
    }

    if (periods <= 0) {
      toast.error('Trading periods must be greater than zero');
      return;
    }

    setIsLoading(true);

    try {
      // Extract numeric data and detected format
      const { values: numericValues, detectedFormat } = extractValidNumbers(
        data.rows,
        columnIndex,
        dataFormat
      );
      const effectiveFormat = dataFormat === 'auto' ? detectedFormat : dataFormat;

      // Validate portfolio value for absolute returns
      if (effectiveFormat === 'absolute' && (!portfolio || portfolio <= 0)) {
        toast.error('Portfolio value is required and must be greater than zero for absolute returns');
        setIsLoading(false);
        return;
      }

      if (numericValues.length < 10) {
        toast.error('Not enough valid numeric data points (minimum 10 required)');
        setIsLoading(false);
        return;
      }

      const params: CalculationParams = {
        riskFreeRate: riskFree,
        tradingPeriods: periods,
        targetReturn: target,
        dataFormat: effectiveFormat, // Use effective format
      };

      if (portfolio) {
        params.portfolioValue = portfolio;
      }

      onProceed(numericValues, params, effectiveFormat);
    } catch (error) {
      console.error('Error processing data:', error);
      toast.error('Failed to process data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the best column to pre-select (often column with numeric data)
  React.useEffect(() => {
    if (data.headers.length > 0) {
      // Try to find columns with names like "return", "pnl", "value"
      const commonNames = ['return', 'pnl', 'value', 'profit', 'loss'];
      const bestMatch = data.headers.findIndex(header => 
        commonNames.some(name => header.toLowerCase().includes(name))
      );
      
      if (bestMatch !== -1) {
        setSelectedColumn(data.headers[bestMatch]);
        setColumnIndex(bestMatch);
      } else {
        // Otherwise just select the first column
        setSelectedColumn(data.headers[0]);
        setColumnIndex(0);
      }
    }
  }, [data.headers]);

  // Helper to get a preview of the table with limited rows
  const getPreviewRows = () => {
    return data.rows.slice(0, 5);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '150ms' }}>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>Data Preview</span>
            <Button variant="ghost" size="sm" onClick={onReset}>Start Over</Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Table Preview */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] bg-muted/50">#</TableHead>
                  {data.headers.map((header, index) => (
                    <TableHead 
                      key={index}
                      className={index === columnIndex ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPreviewRows().map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="bg-muted/20 font-mono text-xs">
                      {rowIndex + 1}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell 
                        key={cellIndex}
                        className={cellIndex === columnIndex ? 'bg-primary/5 font-medium' : ''}
                      >
                        {String(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Showing first 5 rows of {data.rows.length} total rows
          </div>

          {/* Configuration Form */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="column-select">Select Returns/PnL Column</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Choose the column containing your returns or profit/loss values.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={selectedColumn} onValueChange={handleColumnSelect}>
                  <SelectTrigger id="column-select">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {data.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header || `Column ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Data Format</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Specify your data format or let the system auto-detect it.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-auto" 
                      name="format"
                      value="auto"
                      checked={dataFormat === 'auto'}
                      onChange={(e) => setDataFormat(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="format-auto" className="text-sm font-normal">Auto-detect</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-percent" 
                      name="format"
                      value="percent"
                      checked={dataFormat === 'percent'}
                      onChange={(e) => setDataFormat(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="format-percent" className="text-sm font-normal">Percentage (5 = 5%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-decimal" 
                      name="format"
                      value="decimal"
                      checked={dataFormat === 'decimal'}
                      onChange={(e) => setDataFormat(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="format-decimal" className="text-sm font-normal">Decimal (0.05 = 5%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-absolute" 
                      name="format"
                      value="absolute"
                      checked={dataFormat === 'absolute'}
                      onChange={(e) => setDataFormat(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor="format-absolute" className="text-sm font-normal">Absolute ($)</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="risk-free-rate">Annual Risk-Free Rate (%)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The annual risk-free rate as a percentage (e.g., 2 for 2%).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="risk-free-rate"
                  type="number"
                  step="0.01"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(e.target.value)}
                  className="input-number-clean"
                  placeholder="0"
                />
              </div>

              {/* Portfolio Value Input - Only visible for absolute data format */}
              {(dataFormat === 'absolute' || dataFormat === 'auto') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="portfolio-value">Portfolio Value ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Total portfolio value used to convert absolute PnL to percentage returns for more accurate ratio calculations.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="portfolio-value"
                    type="number"
                    step="1"
                    value={portfolioValue}
                    onChange={(e) => setPortfolioValue(e.target.value)}
                    className="input-number-clean"
                    placeholder="e.g., 100000"
                    required={dataFormat === 'absolute'}
                  />
                  {dataFormat === 'absolute' && (
                    <p className="text-sm text-muted-foreground">
                      Required for accurate ratio calculations with absolute returns.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="trading-periods">Trading Periods Per Year</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">252 for daily trading, 52 for weekly, 12 for monthly, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="trading-periods"
                  type="number"
                  step="1"
                  value={tradingPeriods}
                  onChange={(e) => setTradingPeriods(e.target.value)}
                  className="input-number-clean"
                  placeholder="252"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="target-return">Target Return (%) (Optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">For Sortino ratio only. If not provided, the risk-free rate will be used.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="target-return"
                  type="number"
                  step="0.01"
                  value={targetReturn}
                  onChange={(e) => setTargetReturn(e.target.value)}
                  className="input-number-clean"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            className="w-full md:w-auto"
            disabled={isLoading || columnIndex === -1}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Calculate Ratios</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DataPreview;
