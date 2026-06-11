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
  favoritedIds: number[];
  
  toggleSelection: (id: number) => void;
  selectAll: (ids: number[]) => void;
  deselectAll: () => void;
  
  setSearchQuery: (query: string) => void;
  setVisibilityFilter: (filter: FilterVisibility) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setActiveInviteRepoId: (id: number | null) => void;
  setDiscoveryCategory: (category: DiscoveryCategory) => void;
  toggleFavorite: (id: number) => void;
}

const getInitialFavorites = (): number[] => {
  try {
    const saved = localStorage.getItem('github-manager-favorites');
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
  favoritedIds: getInitialFavorites(),

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
  toggleFavorite: (id) =>
    set((state) => {
      const isFav = state.favoritedIds.includes(id);
      const nextFavs = isFav
        ? state.favoritedIds.filter((fid) => fid !== id)
        : [...state.favoritedIds, id];
      try {
        localStorage.setItem('github-manager-favorites', JSON.stringify(nextFavs));
      } catch (e) {
        console.warn('Could not save favorites to localStorage', e);
      }
      return { favoritedIds: nextFavs };
    }),
}));

