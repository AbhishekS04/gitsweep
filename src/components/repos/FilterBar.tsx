import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import type { FilterVisibility, SortOption } from '../../store/selectionStore';
import { FilterDisclosure } from '../ui/filter-disclosure';
import { MorphingDiscoveryBar } from '../ui/morphing-discovery-bar';
import { FaTasks } from 'react-icons/fa';
import { IoCalendar } from 'react-icons/io5';
import { BsFillPeopleFill, BsPinFill } from 'react-icons/bs';
import { RiBubbleChartFill } from 'react-icons/ri';

const FILTER_ITEMS = [
  { id: 'all', label: 'All', icon: FaTasks },
  { id: 'public', label: 'Public', icon: BsFillPeopleFill },
  { id: 'private', label: 'Private', icon: BsPinFill },
  { id: 'archived', label: 'Archived', icon: RiBubbleChartFill },
  { id: 'forks', label: 'Forks', icon: IoCalendar },
];

export const FilterBar: React.FC<{ totalCount: number }> = ({ totalCount }) => {
  const { 
    searchQuery, setSearchQuery, 
    visibilityFilter, setVisibilityFilter,
    sortBy, setSortBy,
  } = useSelectionStore();

  return (
    <div className="flex flex-col gap-4 mb-6 border-b border-border/50 pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Repositories <span className="text-muted-foreground text-lg font-normal ml-2">{totalCount} total</span>
        </h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
          <MorphingDiscoveryBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-grow sm:flex-grow-0"
          />

          <FilterDisclosure
            items={FILTER_ITEMS}
            activeId={visibilityFilter}
            onChange={(id) => setVisibilityFilter(id as FilterVisibility)}
            sortBy={sortBy}
            onChangeSort={(sort) => setSortBy(sort as SortOption)}
          />
        </div>
      </div>
    </div>
  );
};


