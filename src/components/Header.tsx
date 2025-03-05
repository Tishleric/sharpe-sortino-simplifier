
import React from 'react';
import { ChartBar } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-background border-b border-border animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <ChartBar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sharpe & Sortino</h1>
            <p className="text-sm text-muted-foreground">Risk-adjusted performance calculator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
