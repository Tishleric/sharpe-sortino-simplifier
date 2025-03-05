
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { ParsedData, validateFileType, parseFile } from '@/utils/fileUtils';

interface FileUploadProps {
  onDataParsed: (data: ParsedData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!validateFileType(file)) {
      toast.error('Unsupported file type. Please upload CSV, Excel, or TSV file.');
      return;
    }

    setIsLoading(true);
    try {
      const parsedData = await parseFile(file);
      if (parsedData) {
        onDataParsed(parsedData);
        toast.success(`Successfully parsed ${file.name}`);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onDataParsed]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
      <Card className={`border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-border'} transition-all`}>
        <CardContent className="p-6">
          <div 
            className={`flex flex-col items-center justify-center gap-4 py-10 text-center transition-all
              ${isDragging ? 'scale-[1.02]' : 'scale-100'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`p-4 rounded-full bg-muted ${isLoading ? 'animate-pulse-subtle' : ''}`}>
              {isLoading ? (
                <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              ) : (
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload your data file</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <div className="flex items-center justify-center mt-2 gap-2 flex-wrap">
                <div className="bg-accent py-1 px-3 rounded-full text-xs flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>CSV</span>
                </div>
                <div className="bg-accent py-1 px-3 rounded-full text-xs flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>Excel</span>
                </div>
                <div className="bg-accent py-1 px-3 rounded-full text-xs flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>TSV</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <label htmlFor="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.tsv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <Button 
                  variant="outline" 
                  className="relative overflow-hidden"
                  disabled={isLoading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select File
                  {isLoading && <div className="absolute inset-0 bg-background/50" />}
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;
