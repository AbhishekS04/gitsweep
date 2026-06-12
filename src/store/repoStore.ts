import { create } from 'zustand';
import { fetchAllRepos } from '../lib/github';
import type { Repo } from '../lib/github';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

interface RepoState {
  repos: Repo[];
  loading: boolean;
  error: string | null;
  fetchRepos: () => Promise<void>;
  updateRepoLocally: (repoId: number, updates: Partial<Repo>) => void;
  removeReposLocally: (repoIds: number[]) => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  repos: [],
  loading: false,
  error: null,
  fetchRepos: async () => {
    set({ loading: true, error: null });
    try {
      const repos = await fetchAllRepos();
      set({ repos, loading: false });
    } catch (err) {
      const error = err as Error;
      toast.error('Sync failed', { description: error.message || 'Could not fetch repositories from GitHub.' });
      
      if (error.message?.includes('Bad credentials') || error.message?.includes('401')) {
        useAuthStore.getState().logout();
      }
      
      set({ error: error.message || 'Failed to fetch repositories', loading: false });
    }
  },
  updateRepoLocally: (repoId, updates) => {
    set((state) => ({
      repos: state.repos.map((repo) =>
        repo.id === repoId ? { ...repo, ...updates } : repo
      ),
    }));
  },
  removeReposLocally: (repoIds) => {
    set((state) => ({
      repos: state.repos.filter((repo) => !repoIds.includes(repo.id)),
    }));
  },
}));
