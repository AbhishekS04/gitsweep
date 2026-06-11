import React, { useState, useEffect } from 'react';
import type { Repo } from '../../lib/github';
import { Checkbox } from '../ui/Checkbox';
import { Lock, Unlock, Archive, GitFork, Star, HardDrive, Clock, Users, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useSelectionStore } from '../../store/selectionStore';
import { fetchRepoCollaborators } from '../../lib/github';
import { CollaboratorPanel } from './CollaboratorPanel';
import { Button } from '../ui/Button';

interface RepoItemProps {
  repo: Repo;
  isSelected: boolean;
  onToggle: (id: number) => void;
  index: number;
}

const formatDistanceToNow = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
};

const formatSize = (kb: number) => {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const getLanguageColor = (lang: string | null) => {
  if (!lang) return 'bg-muted';
  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-400',
    JavaScript: 'bg-yellow-400',
    Python: 'bg-blue-500',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
    Java: 'bg-red-500',
    CSS: 'bg-purple-500',
    HTML: 'bg-orange-600',
    Ruby: 'bg-red-600',
    Shell: 'bg-green-500',
    C: 'bg-gray-500',
    'C++': 'bg-pink-500',
    'C#': 'bg-green-600',
  };
  return colors[lang] || 'bg-accent';
};

export const RepoRow: React.FC<RepoItemProps> = ({ repo, isSelected, onToggle, index }) => {
  const { user } = useAuthStore();
  const isContribution = repo.owner.login !== user?.login;
  const { activeInviteRepoId, setActiveInviteRepoId, favoritedIds, toggleFavorite } = useSelectionStore();
  
  const isInviteOpen = activeInviteRepoId === repo.id;
  const toggleInvite = () => {
    setActiveInviteRepoId(isInviteOpen ? null : repo.id);
  };

  const [collabCount, setCollabCount] = useState<number | null>(null);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const getCollabs = async () => {
      setLoadingCollabs(true);
      try {
        const data = await fetchRepoCollaborators(repo.owner.login, repo.name);
        if (isMounted) {
          setCollabCount(data.length);
        }
      } catch (err) {
        console.warn(`Could not load collaborators for ${repo.name}:`, err);
      } finally {
        if (isMounted) {
          setLoadingCollabs(false);
        }
      }
    };
    getCollabs();
    return () => { isMounted = false; };
  }, [repo.owner.login, repo.name]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.owner === repo.owner.login && customEvent.detail.repoName === repo.name) {
        setCollabCount(customEvent.detail.count);
      }
    };
    window.addEventListener('repo-collab-updated', handleUpdate);
    return () => {
      window.removeEventListener('repo-collab-updated', handleUpdate);
    };
  }, [repo.owner.login, repo.name]);

  return (
    <div className="flex flex-col w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.2 }}
        className={cn(
          "group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-4 px-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
          isSelected 
            ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]" 
            : "border-border/40 bg-background hover:bg-accent/40 hover:border-border/80"
        )}
        onClick={() => onToggle(repo.id)}
      >
        <div className="flex items-start md:items-center gap-4 flex-1 w-full overflow-hidden">
          <div className="mt-1 md:mt-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono font-medium text-base truncate text-foreground/90 group-hover:text-primary transition-colors">
                {repo.name}
                {isContribution && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    by {repo.owner.login}
                  </span>
                )}
              </h3>
              
              {repo.private ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 h-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/25">
                  <Lock className="h-3 w-3" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 h-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/25">
                  <Unlock className="h-3 w-3" /> Public
                </span>
              )}

              {repo.archived && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2.5 h-6 text-[10px] font-semibold uppercase tracking-wider">
                  <Archive className="h-3 w-3" /> Archived
                </span>
              )}
              
              {repo.fork && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 h-6 text-[10px] font-semibold uppercase tracking-wider">
                  <GitFork className="h-3 w-3" /> Fork
                </span>
              )}

              {!isContribution && (
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all select-none cursor-pointer shrink-0 ml-1.5 shadow-sm h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleInvite();
                  }}
                >
                  <UserPlus className="h-2.5 w-2.5 text-primary" /> Invite
                </Button>
              )}
            </div>
            
            {repo.description && (
              <p className="text-sm text-muted-foreground truncate max-w-2xl">
                {repo.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3 pl-8 md:flex md:flex-row md:items-center md:gap-x-0 md:gap-y-0 md:ml-auto md:w-auto md:pl-0 md:mt-0 text-xs text-muted-foreground w-full">
          {repo.language && (
            <div className="flex items-center gap-1.5 w-full md:w-28">
              <span className={cn("h-2 w-2 rounded-full shrink-0", getLanguageColor(repo.language))} />
              <span className="truncate">{repo.language}</span>
            </div>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(repo.id);
            }}
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0 focus:outline-none hover:text-yellow-500",
              favoritedIds.includes(repo.id) ? "text-yellow-500" : "text-muted-foreground/80"
            )}
            title={favoritedIds.includes(repo.id) ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star className={cn("h-3.5 w-3.5 shrink-0 transition-transform active:scale-75", favoritedIds.includes(repo.id) && "fill-yellow-500")} />
            <span className="font-mono">{repo.stargazers_count}</span>
          </button>

          <div 
            className="flex items-center gap-1.5 w-full md:w-32 shrink-0 cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (!isContribution) toggleInvite();
            }}
            title="Manage Collaborators"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            {loadingCollabs ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <span className="font-mono">
                {collabCount !== null 
                  ? `${collabCount} member${collabCount !== 1 ? 's' : ''}` 
                  : isContribution ? 'Public' : 'Members'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 w-full md:w-24">
            <HardDrive className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span className="font-mono">{formatSize(repo.size)}</span>
          </div>
          
          <div className="flex items-center gap-1 col-span-2 md:col-span-1 w-full md:w-28 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span className="font-mono">{formatDistanceToNow(repo.updated_at)}</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isInviteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full -mt-1 bg-background z-20 border border-t-0 border-border/40 rounded-b-lg overflow-hidden"
          >
            <CollaboratorPanel 
              owner={repo.owner.login}
              repoName={repo.name}
              onClose={() => setActiveInviteRepoId(null)}
              onCountChange={setCollabCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RepoCard: React.FC<RepoItemProps> = ({ repo, isSelected, onToggle, index }) => {
  const { user } = useAuthStore();
  const isContribution = repo.owner.login !== user?.login;
  const { activeInviteRepoId, setActiveInviteRepoId, favoritedIds, toggleFavorite } = useSelectionStore();

  const isInviteOpen = activeInviteRepoId === repo.id;
  const toggleInvite = () => {
    setActiveInviteRepoId(isInviteOpen ? null : repo.id);
  };

  const [collabCount, setCollabCount] = useState<number | null>(null);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const getCollabs = async () => {
      setLoadingCollabs(true);
      try {
        const data = await fetchRepoCollaborators(repo.owner.login, repo.name);
        if (isMounted) {
          setCollabCount(data.length);
        }
      } catch (err) {
        console.warn(`Could not load collaborators for ${repo.name}:`, err);
      } finally {
        if (isMounted) {
          setLoadingCollabs(false);
        }
      }
    };
    getCollabs();
    return () => { isMounted = false; };
  }, [repo.owner.login, repo.name]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.owner === repo.owner.login && customEvent.detail.repoName === repo.name) {
        setCollabCount(customEvent.detail.count);
      }
    };
    window.addEventListener('repo-collab-updated', handleUpdate);
    return () => {
      window.removeEventListener('repo-collab-updated', handleUpdate);
    };
  }, [repo.owner.login, repo.name]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.2), duration: 0.2 }}
      className={cn(
        "group relative flex flex-col justify-between gap-4 p-5 rounded-xl border transition-all cursor-pointer h-48 overflow-hidden shadow-sm hover:shadow-md",
        isSelected 
          ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]" 
          : "border-border/40 bg-background hover:bg-accent/30 hover:border-border/80"
      )}
      onClick={() => onToggle(repo.id)}
    >
      <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
      </div>

      <div className="flex flex-col gap-2 pr-8">
        <h3 className="font-mono font-medium text-base truncate text-foreground/90 group-hover:text-primary transition-colors flex items-center gap-1.5">
          <span className="truncate">{repo.name}</span>
          {!isContribution && (
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all select-none cursor-pointer shrink-0 ml-1 h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleInvite();
              }}
            >
              <UserPlus className="h-2.5 w-2.5 text-primary" /> Invite
            </Button>
          )}
        </h3>
        {repo.owner.login !== user?.login && (
          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
            by {repo.owner.login}
          </span>
        )}
      </div>
        
      <div className="flex flex-wrap gap-1.5">
        {repo.private ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 h-5.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-accent/20">
            <Lock className="h-2.5 w-2.5" /> Private
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 h-5.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-accent/20">
            <Unlock className="h-2.5 w-2.5" /> Public
          </span>
        )}

        {repo.archived && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 h-5.5 text-[9px] font-bold uppercase tracking-wider">
            <Archive className="h-2.5 w-2.5" /> Archived
          </span>
        )}
        
        {repo.fork && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 h-5.5 text-[9px] font-bold uppercase tracking-wider">
            <GitFork className="h-2.5 w-2.5" /> Fork
          </span>
        )}
      </div>

      {repo.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {repo.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/40">
        {repo.language ? (
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className={cn("h-2 w-2 rounded-full shrink-0", getLanguageColor(repo.language))} />
            <span className="truncate">{repo.language}</span>
          </div>
        ) : <div />}
        
        <div className="flex items-center gap-3 shrink-0">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors mr-1"
            onClick={(e) => {
              e.stopPropagation();
              if (!isContribution) toggleInvite();
            }}
            title="Manage Collaborators"
          >
            <Users className="h-3.5 w-3.5" />
            {loadingCollabs ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="font-mono">
                {collabCount !== null 
                  ? collabCount 
                  : isContribution ? 'Public' : 'Members'}
              </span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(repo.id);
            }}
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0 focus:outline-none hover:text-yellow-500",
              favoritedIds.includes(repo.id) ? "text-yellow-500" : "text-muted-foreground"
            )}
            title={favoritedIds.includes(repo.id) ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star className={cn("h-3.5 w-3.5 transition-transform active:scale-75", favoritedIds.includes(repo.id) && "fill-yellow-500")} />
            <span className="font-mono">{repo.stargazers_count}</span>
          </button>
          <div className="flex items-center gap-1" title={formatDistanceToNow(repo.updated_at)}>
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
