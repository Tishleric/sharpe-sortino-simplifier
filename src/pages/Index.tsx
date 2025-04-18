import React, { useState } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import Results from '@/components/Results';
import { ParsedData } from '@/utils/fileUtils';
import { CalculationParams, CalculationResult, calculateSharpeAndSortino } from '@/utils/calculationUtils';
import { Separator } from '@/components/ui/separator';

// Application states
enum AppState {
  UPLOAD = 'UPLOAD',
  PREVIEW = 'PREVIEW',
  RESULTS = 'RESULTS'
}

const Index = () => {
  // Store calculation parameters for Excel export
  const [calculationParams, setCalculationParams] = useState<CalculationParams | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [returnValues, setReturnValues] = useState<number[]>([]);
  const [dataFormat, setDataFormat] = useState<string>('auto');
  
  // Handle file upload
  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data);
    setAppState(AppState.PREVIEW);
  };
  
  // Handle calculation
  const handleCalculate = (values: number[], params: CalculationParams, format: string) => {
    // Save params for downstream features (e.g., Excel export)
    const paramsWithFormat = {
      ...params,
      dataFormat: format
    };
    
    const calculationResult = calculateSharpeAndSortino(values, paramsWithFormat);
    setReturnValues(values);
    setResult(calculationResult);
    setDataFormat(format);
    setAppState(AppState.RESULTS);
    setCalculationParams(paramsWithFormat);
  };
  
  // Reset and start over
  const handleReset = () => {
    setParsedData(null);
    setResult(null);
    setReturnValues([]);
    setDataFormat('auto');
    setAppState(AppState.UPLOAD);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Introduction */}
        {appState === AppState.UPLOAD && (
          <div className="max-w-2xl mx-auto mb-10 text-center animate-fade-in">
            <div className="inline-block py-1 px-3 mb-4 text-xs font-medium text-primary bg-primary/10 rounded-full">
              Financial Analysis Tool
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Sharpe & Sortino Ratio Calculator
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your returns data to analyze risk-adjusted performance with industry-standard metrics.
              Simply upload a CSV or Excel file containing your periodic returns or PnL data.
            </p>
          </div>
        )}
        
        {/* Step Indicators - Only show in the first two states */}
        {(appState === AppState.UPLOAD || appState === AppState.PREVIEW) && (
          <div className="max-w-lg mx-auto mb-10 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-between">
                <div className="flex items-center justify-center">
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                    appState === AppState.UPLOAD ? 'bg-primary text-white border-transparent' : 'bg-background text-muted-foreground'
                  }`}>
                    1
                  </div>
                  <span className={`absolute -bottom-6 text-xs ${
                    appState === AppState.UPLOAD ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    Upload
                  </span>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                    appState === AppState.PREVIEW ? 'bg-primary text-white border-transparent' : 'bg-background text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <span className={`absolute -bottom-6 text-xs ${
                    appState === AppState.PREVIEW ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    Configure
                  </span>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                    appState as string === AppState.RESULTS ? 'bg-primary text-white border-transparent' : 'bg-background text-muted-foreground'
                  }`}>
                    3
                  </div>
                  <span className={`absolute -bottom-6 text-xs ${
                    appState as string === AppState.RESULTS ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    Results
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content - Conditional rendering based on app state */}
        <div className="max-w-4xl mx-auto">
          {appState === AppState.UPLOAD && (
            <FileUpload onDataParsed={handleDataParsed} />
          )}
          
          {appState === AppState.PREVIEW && parsedData && (
            <DataPreview 
              data={parsedData} 
              onProceed={handleCalculate}
              onReset={handleReset}
            />
          )}
          
          {appState === AppState.RESULTS && result && (
            <Results 
              result={result} 
              returnValues={returnValues}
              onReset={handleReset}
              dataFormat={dataFormat}
              params={calculationParams!} // non-null since only in RESULTS state
            />
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Sharpe & Sortino Ratio Calculator • Professional financial analysis tool
        </div>
      </footer>
    </div>
  );
};

export default Index;
