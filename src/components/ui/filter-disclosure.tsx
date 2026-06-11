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
      <div className="flex items-center">
        <motion.button
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.95 }}
          className="z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background shadow-sm hover:bg-accent/45 text-foreground transition-all duration-200"
        >
          <PiFunnelSimpleBold className="h-4.5 w-4.5 text-foreground/85" />
        </motion.button>

        <div
          className="z-0 -ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/70 opacity-90 shadow-sm backdrop-blur-xs cursor-pointer hover:bg-accent/20 transition-all"
          onClick={() => setOpen(!open)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveIcon className="h-4 w-4 text-primary shrink-0" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2.5 z-20 flex w-[210px] flex-col gap-0.5 overflow-hidden rounded-xl border border-border/80 bg-background p-1.5 shadow-xl will-change-transform dark:border-border/40 dark:bg-neutral-900 origin-top-left sm:origin-top-right"
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
