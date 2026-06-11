"use client";

import { useState, type ReactNode, type FC } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface FluidTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  hideLabelOnMobile?: boolean;
}

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className,
  hideLabelOnMobile = false,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div className={cn("relative flex items-center gap-1 rounded-full border border-border bg-neutral-900/60 p-1 transition-colors sm:gap-2 overflow-x-auto max-w-full scrollbar-none", className)}>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className="group relative rounded-full px-3 py-1.5 outline-none sm:px-4 sm:py-2 cursor-pointer border-none bg-transparent flex-shrink-0"
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 26,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-full border border-white/10 bg-white/10 shadow-sm"
              />
            )}

            {/* Hover Indicator */}
            {!isActive && hoveredTab === tab.id && (
              <motion.div
                layoutId="hover-pill"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 28,
                }}
                className="absolute inset-0 rounded-full bg-white/5"
              />
            )}

            <motion.div
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              animate={{
                filter: isActive
                  ? ["blur(0px)", "blur(1px)", "blur(0px)"]
                  : "blur(0px)",
              }}
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 sm:gap-2.5 ${
                isActive
                  ? "font-semibold text-white"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 15 },
                }}
                className="flex shrink-0 items-center justify-center text-current"
              >
                {tab.icon}
              </motion.div>

              <span className={cn("text-xs font-mono tracking-tight whitespace-nowrap uppercase sm:text-xs", hideLabelOnMobile && "hidden sm:inline")}>
                {tab.label}
              </span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};
