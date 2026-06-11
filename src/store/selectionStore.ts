import { create } from 'zustand';

export type FilterVisibility = 'all' | 'public' | 'private' | 'archived' | 'forks';
export type SortOption = 'updated' | 'name' | 'stars' | 'size';
export type DiscoveryCategory = 'all' | 'popular' | 'favorites';

interface SelectionState {
  selectedIds: Set<number>;
  searchQuery: string;
  visibilityFilter: FilterVisibility;
  sortBy: SortOption;
  viewMode: 'list' | 'grid';
  activeInviteRepoId: number | null;
  discoveryCategory: DiscoveryCategory;
  pinnedIds: number[];
  
  toggleSelection: (id: number) => void;
  selectAll: (ids: number[]) => void;
  deselectAll: () => void;
  
  setSearchQuery: (query: string) => void;
  setVisibilityFilter: (filter: FilterVisibility) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setActiveInviteRepoId: (id: number | null) => void;
  setDiscoveryCategory: (category: DiscoveryCategory) => void;
  togglePin: (id: number) => void;
}

const getInitialPins = (): number[] => {
  try {
    const saved = localStorage.getItem('github-manager-pins') || localStorage.getItem('github-manager-favorites');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: new Set(),
  searchQuery: '',
  visibilityFilter: 'all',
  sortBy: 'updated',
  viewMode: 'list',
  activeInviteRepoId: null,
  discoveryCategory: 'all',
  pinnedIds: getInitialPins(),

  toggleSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet };
    }),
  
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  
  deselectAll: () => set({ selectedIds: new Set() }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setVisibilityFilter: (visibilityFilter) => set({ visibilityFilter, selectedIds: new Set() }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveInviteRepoId: (activeInviteRepoId) => set({ activeInviteRepoId }),
  setDiscoveryCategory: (discoveryCategory) => set({ discoveryCategory }),
  togglePin: (id) =>
    set((state) => {
      const isPinned = state.pinnedIds.includes(id);
      const nextPins = isPinned
        ? state.pinnedIds.filter((pid) => pid !== id)
        : [...state.pinnedIds, id];
      try {
        localStorage.setItem('github-manager-pins', JSON.stringify(nextPins));
      } catch (e) {
        console.warn('Could not save pins to localStorage', e);
      }
      return { pinnedIds: nextPins };
    }),
}));

