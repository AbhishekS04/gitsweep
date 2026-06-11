"use client";

import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaTasks } from "react-icons/fa";
import { IoCalendar } from "react-icons/io5";
import { BsCheckLg, BsFillPeopleFill, BsPinFill } from "react-icons/bs";
import { RiBubbleChartFill } from "react-icons/ri";
import { PiFunnelSimpleBold } from "react-icons/pi";
import type { IconType } from "react-icons";
import { cn } from "../../lib/utils";

export interface FilterItem {
  id: string;
  label: string;
  icon: IconType;
}

interface FilterDisclosureProps {
  items?: FilterItem[];
  activeId?: string;
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  sortBy?: string;
  onChangeSort?: (sort: string) => void;
}

const DEFAULT_ITEMS: FilterItem[] = [
  { id: "tasks", label: "Tasks", icon: FaTasks },
  { id: "events", label: "Events", icon: IoCalendar },
  { id: "reminders", label: "Reminders", icon: FaBell },
  { id: "appointments", label: "Appointment", icon: BsPinFill },
  { id: "meetings", label: "Mettings", icon: BsFillPeopleFill },
  { id: "celebrations", label: "Celebrations", icon: RiBubbleChartFill },
];

const SORT_ITEMS = [
  { id: "updated", label: "Last Updated" },
  { id: "name", label: "Name (A-Z)" },
  { id: "stars", label: "Stars" },
  { id: "size", label: "Size" },
];

export const FilterDisclosure: FC<FilterDisclosureProps> = ({
  items = DEFAULT_ITEMS,
  activeId,
  defaultActiveId,
  onChange,
  sortBy,
  onChangeSort,
}) => {
  const [open, setOpen] = useState(false);
  const [localActive, setLocalActive] = useState(defaultActiveId || items[0]?.id || "all");
  const [localSort, setLocalSort] = useState("updated");

  const active = activeId !== undefined ? activeId : localActive;
  const activeItem = items.find((i) => i.id === active);
  const ActiveIcon = activeItem ? activeItem.icon : FaTasks;

  const currentSort = sortBy !== undefined ? sortBy : localSort;

  const handleSelectFilter = (id: string) => {
    setLocalActive(id);
    onChange?.(id);
    setTimeout(() => setOpen(false), 150);
  };

  const handleSelectSort = (id: string) => {
    setLocalSort(id);
    onChangeSort?.(id);
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Click outside backdrop overlay */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-40 bg-transparent cursor-default"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Trigger Button and Active Icon row */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.97 }}
        className="flex h-9 items-center gap-2 px-2.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-md shadow-sm hover:bg-accent/45 text-foreground transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
      >
        <PiFunnelSimpleBold className="h-4 w-4 text-foreground/80 shrink-0" />
        <div className="w-[1px] h-3.5 bg-border/60 shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.6, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 2 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center shrink-0"
            >
              <ActiveIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            </motion.div>
          </AnimatePresence>
          <span className="text-[10px] font-bold uppercase font-mono tracking-tight text-foreground/75 shrink-0 hidden sm:inline">
            {activeItem?.label || "All"}
          </span>
        </div>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2.5 z-50 flex w-[210px] flex-col gap-0.5 overflow-hidden rounded-xl border border-border/80 bg-background p-1.5 shadow-xl will-change-transform dark:border-border/40 dark:bg-neutral-900 origin-top-left sm:origin-top-right"
          >
            {/* Filter Section */}
            <div className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
              Filter By
            </div>
            
            {items.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectFilter(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent/40 text-xs font-mono text-foreground/80 border-none bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground/85">
                      {item.label}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-transparent"
                    )}
                  >
                    {selected && <BsCheckLg className="h-2 w-2 text-white" />}
                  </div>
                </button>
              );
            })}

            <div className="h-px bg-border/40 my-1.5 shrink-0" />

            {/* Sort Section */}
            <div className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
              Sort By
            </div>

            {SORT_ITEMS.map((item) => {
              const selected = currentSort === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSort(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent/40 text-xs font-mono text-foreground/80 border-none bg-transparent"
                >
                  <span className="text-xs font-medium text-foreground/85">
                    {item.label}
                  </span>

                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-transparent"
                    )}
                  >
                    {selected && <BsCheckLg className="h-2 w-2 text-white" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
