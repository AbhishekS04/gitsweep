import React from 'react';
import { RepoRow, RepoCard } from './RepoRow';
import type { Repo } from '../../lib/github';
import { useSelectionStore } from '../../store/selectionStore';
import { useAuthStore } from '../../store/authStore';
import { CheckSquare, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimatePresence } from 'framer-motion';
import { CollaboratorModal } from './CollaboratorPanel';

interface RepoListProps {
  repos: Repo[];
  isLoading: boolean;
}

export const RepoList: React.FC<RepoListProps> = ({ repos, isLoading }) => {
  const { selectedIds, toggleSelection, viewMode, activeInviteRepoId, setActiveInviteRepoId } = useSelectionStore();
  const { user } = useAuthStore();

  const handleSelectAll = (reposToSelect: Repo[]) => {
    const allSelected = reposToSelect.every(r => selectedIds.has(r.id));
    if (allSelected) {
      const idsToRemove = reposToSelect.map(r => r.id);
      idsToRemove.forEach(id => {
        if (selectedIds.has(id)) toggleSelection(id);
      });
    } else {
      reposToSelect.forEach(r => {
        if (!selectedIds.has(r.id)) toggleSelection(r.id);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 w-full rounded-lg border border-border/40 bg-accent/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/60 rounded-xl bg-accent/5">
        <div className="bg-background p-4 rounded-full border border-border mb-4">
          <CheckSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No repositories found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Try adjusting your search query or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  // Grouping logic
  const ownedRepos = repos.filter(r => r.owner.login === user?.login && !r.fork);
  const forkedRepos = repos.filter(r => r.owner.login === user?.login && r.fork);
  const contributionRepos = repos.filter(r => r.owner.login !== user?.login);

  const sections = [
    { title: 'My Repositories', repos: ownedRepos },
    { title: 'Forked Repositories', repos: forkedRepos },
    { title: 'Contributions', repos: contributionRepos },
  ].filter(s => s.repos.length > 0);

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground/80 uppercase">
                {section.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground lowercase">
                  ({section.repos.length})
                </span>
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSelectAll(section.repos)}
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {section.repos.every(r => selectedIds.has(r.id)) ? 'Deselect Section' : 'Select Section'}
            </Button>
          </div>

          {viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {section.repos.map((repo, index) => (
                <RepoRow 
                  key={repo.id} 
                  repo={repo} 
                  isSelected={selectedIds.has(repo.id)} 
                  onToggle={toggleSelection}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.repos.map((repo, index) => (
                <RepoCard 
                  key={repo.id} 
                  repo={repo} 
                  isSelected={selectedIds.has(repo.id)} 
                  onToggle={toggleSelection}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Spacer for bottom action bar */}
      <div className="h-24" />

      {/* Collaborator management modal for Grid layout */}
      <AnimatePresence>
        {viewMode === 'grid' && activeInviteRepoId !== null && (() => {
          const activeInviteRepo = repos.find(r => r.id === activeInviteRepoId);
          if (!activeInviteRepo) return null;
          return (
            <CollaboratorModal
              owner={activeInviteRepo.owner.login}
              repoName={activeInviteRepo.name}
              onClose={() => setActiveInviteRepoId(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
