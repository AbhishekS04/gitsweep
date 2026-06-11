"use client";

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MorphingDiscoveryBarProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const MorphingDiscoveryBar: React.FC<MorphingDiscoveryBarProps> = ({
  className = "",
  value,
  onChange,
}) => {
  const [localSearchValue, setLocalSearchValue] = useState("");
  const searchValue = value !== undefined ? value : localSearchValue;

  const setSearchValue = (val: string) => {
    setLocalSearchValue(val);
    onChange?.(val);
  };

  return (
    <div className={cn("relative flex items-center w-full sm:w-72 md:w-80 h-9", className)}>
      <div className="absolute left-3 flex items-center pointer-events-none text-foreground/50">
        <Search size={14} strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder="Search repositories..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full h-full bg-background border border-border/60 dark:border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-full pl-9 pr-8 text-xs font-mono font-medium text-foreground placeholder:text-muted-foreground/80 outline-none transition-all shadow-sm focus:outline-none"
      />
      {searchValue && (
        <button
          onClick={() => setSearchValue("")}
          className="absolute right-2.5 p-1 rounded-full text-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center outline-none"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
