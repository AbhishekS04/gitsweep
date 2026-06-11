import React, { useEffect, useMemo } from 'react';
import { useRepoStore } from '../store/repoStore';
import { useSelectionStore } from '../store/selectionStore';
import { useAuthStore } from '../store/authStore';
import { FilterBar } from '../components/repos/FilterBar';
import { RepoList } from '../components/repos/RepoList';
import { ActionBar } from '../components/layout/ActionBar';
import { TelegramSetupBanner } from '../components/ui/TelegramSetupBanner';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { repos, loading, error, fetchRepos } = useRepoStore();
  const { token } = useAuthStore();
  const { searchQuery, visibilityFilter, sortBy, discoveryCategory, favoritedIds } = useSelectionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRepos();
  }, [token, navigate, fetchRepos]);

  const filteredAndSortedRepos = useMemo(() => {
    let result = [...repos];

    // Apply Discovery Category Filter
    if (discoveryCategory === 'popular') {
      result = result.filter(r => r.stargazers_count > 0);
    } else if (discoveryCategory === 'favorites') {
      result = result.filter(r => favoritedIds.includes(r.id));
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q)
      );
    }

    // Apply Visibility/Type Filter
    switch (visibilityFilter) {
      case 'public':
        result = result.filter(r => !r.private);
        break;
      case 'private':
        result = result.filter(r => r.private);
        break;
      case 'archived':
        result = result.filter(r => r.archived);
        break;
      case 'forks':
        result = result.filter(r => r.fork);
        break;
      case 'all':
      default:
        break;
    }

    // Apply Sorting
    result.sort((a, b) => {
      // If popular category is active and sorting is set to default (updated), sort by stars instead
      const activeSortBy = (discoveryCategory === 'popular' && sortBy === 'updated') ? 'stars' : sortBy;
      
      switch (activeSortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'size':
          return b.size - a.size;
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [repos, searchQuery, visibilityFilter, sortBy, discoveryCategory, favoritedIds]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-lg font-semibold text-destructive">Failed to load repositories</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <button 
          onClick={() => fetchRepos()} 
          className="text-primary hover:underline mt-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <TelegramSetupBanner />
      <FilterBar totalCount={filteredAndSortedRepos.length} />
      <RepoList repos={filteredAndSortedRepos} isLoading={loading} />
      <ActionBar />
    </div>
  );
};
