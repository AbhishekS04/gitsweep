"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, X, List, LayoutGrid } from 'lucide-react';

/* ---------- Types ---------- */
export interface MorphingDiscoveryBarProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

/* ---------- Motion Settings ---------- */
const transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 1
} as const;

export const MorphingDiscoveryBar: React.FC<MorphingDiscoveryBarProps> = ({
  className = "",
  value,
  onChange,
  viewMode,
  onViewModeChange
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchValue = value !== undefined ? value : localSearchValue;
  const setSearchValue = (val: string) => {
    setLocalSearchValue(val);
    onChange?.(val);
  };

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  return (
    <div className={`flex items-center justify-center bg-transparent transition-all ${isSearching ? 'flex-grow min-w-0' : ''} ${className}`}>
      <div className="flex items-center justify-center h-10 w-full">
        <LayoutGroup>
          <motion.div
            layout
            transition={transition}
            className={`flex items-center gap-1.5 sm:gap-2 p-1 rounded-full backdrop-blur-md w-full ${isSearching ? 'justify-end' : 'justify-center'}`}
          >
            {/* SEARCH COMPONENT */}
            <motion.div
              layout
              transition={transition}
              className={`relative flex items-center shadow-sm border overflow-hidden transition-colors rounded-full ${
                isSearching
                  ? 'w-full sm:w-72 md:w-[360px] h-9'
                  : 'w-9 h-9'
              } bg-background border-border/60 dark:border-border/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30`}
            >
              <div className="flex items-center justify-center w-full px-2.5 h-full">
                <motion.div layout="position" transition={transition}>
                  <Search
                    size={15}
                    strokeWidth={2.5}
                    className="shrink-0 transition-colors text-foreground/80 cursor-pointer"
                    onClick={() => {
                      if (!isSearching) setIsSearching(true);
                    }}
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {isSearching && (
                    <motion.input
                      key="search-input"
                      ref={inputRef}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      placeholder="Search repositories..."
                      className="bg-transparent border-none outline-none w-full text-xs font-mono font-medium ml-2 text-foreground placeholder:text-muted-foreground/80 focus:ring-0 focus:outline-none"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  )}
                </AnimatePresence>

                {!isSearching && (
                  <motion.button
                    layoutId="search-click-overlay"
                    className="absolute inset-0 z-10 w-full h-full cursor-pointer animate-none bg-transparent border-none focus:outline-none"
                    onClick={() => setIsSearching(true)}
                  />
                )}
              </div>
            </motion.div>

            {/* VIEW MODE TOGGLE BUTTONS */}
            <AnimatePresence mode="popLayout">
              {!isSearching ? (
                <motion.div
                  key="view-toggle"
                  layout
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                  transition={transition}
                  className="flex items-center gap-1 rounded-full p-0.5 border bg-background border-border/40 overflow-hidden"
                >
                  <motion.button
                    layout
                    onClick={() => onViewModeChange('list')}
                    className={`relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors whitespace-nowrap font-bold text-[10px] tracking-tight z-0 uppercase font-mono cursor-pointer border-none bg-transparent ${
                      viewMode === 'list' ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {viewMode === 'list' && (
                      <motion.div
                        layoutId="view-pill-bg"
                        className="absolute inset-0 z-[-1] rounded-full shadow-sm bg-accent/60 dark:bg-neutral-800 border border-border/10"
                        transition={transition}
                      />
                    )}
                    <List size={14} className="shrink-0" />
                    <span>List</span>
                  </motion.button>

                  <motion.button
                    layout
                    onClick={() => onViewModeChange('grid')}
                    className={`relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors whitespace-nowrap font-bold text-[10px] tracking-tight z-0 uppercase font-mono cursor-pointer border-none bg-transparent ${
                      viewMode === 'grid' ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {viewMode === 'grid' && (
                      <motion.div
                        layoutId="view-pill-bg"
                        className="absolute inset-0 z-[-1] rounded-full shadow-sm bg-accent/60 dark:bg-neutral-800 border border-border/10"
                        transition={transition}
                      />
                    )}
                    <LayoutGrid size={14} className="shrink-0" />
                    <span>Grid</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="close-action"
                  layout
                  initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: -90 }}
                  transition={transition}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsSearching(false);
                    setSearchValue("");
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm border shrink-0 transition-colors bg-background border-border/60 text-foreground/80 hover:bg-accent/40 cursor-pointer"
                >
                  <X size={15} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
};
