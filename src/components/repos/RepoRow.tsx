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

  const isStarred = favoritedIds.includes(repo.id);

  return (
    <div className="flex flex-col w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.25, type: 'spring', stiffness: 200, damping: 22 }}
        className={cn(
          "group flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-4 px-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
          isSelected 
            ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
            : "border-white/[0.06] bg-neutral-900/40 hover:bg-neutral-800/40 hover:border-white/10"
        )}
        onClick={() => onToggle(repo.id)}
      >
        <div className="flex items-start md:items-center gap-3 sm:gap-4 flex-1 w-full min-w-0">
          <div className="mt-1 md:mt-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono font-medium text-sm sm:text-base truncate text-white group-hover:text-primary transition-colors max-w-full">
                {repo.name}
                {isContribution && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    by {repo.owner.login}
                  </span>
                )}
              </h3>
              
              {repo.private ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 px-2 h-5.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10">
                  <Lock className="h-2.5 w-2.5" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 px-2 h-5.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10">
                  <Unlock className="h-2.5 w-2.5" /> Public
                </span>
              )}

              {repo.archived && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 px-2 h-5.5 text-[9px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10">
                  <Archive className="h-2.5 w-2.5" /> Archived
                </span>
              )}
              
              {repo.fork && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 px-2 h-5.5 text-[9px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10">
                  <GitFork className="h-2.5 w-2.5" /> Fork
                </span>
              )}

              {!isContribution && (
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all select-none cursor-pointer shrink-0 ml-1.5 h-5.5 px-2 text-[9px] font-bold uppercase tracking-wider shadow-sm"
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
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-xl">
                {repo.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pl-8 md:mt-0 md:pl-0 md:ml-auto text-[11px] sm:text-xs text-muted-foreground w-full md:w-auto shrink-0 border-t border-white/[0.04] pt-2 md:pt-0 md:border-t-0">
          {repo.language && (
            <div className="flex items-center gap-1.5 w-[90px] sm:w-28 shrink-0">
              <span className="h-2 w-2 rounded-full shrink-0 relative flex">
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", getLanguageColor(repo.language))} />
                <span className={cn("relative inline-flex rounded-full h-2 w-2", getLanguageColor(repo.language))} />
              </span>
              <span className="truncate text-white/90">{repo.language}</span>
            </div>
          )}
          
          <motion.button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(repo.id);
            }}
            whileTap={{ scale: 0.8 }}
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0 focus:outline-none hover:text-yellow-400 shrink-0",
              isStarred ? "text-yellow-400" : "text-muted-foreground/80"
            )}
            title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
          >
            <motion.div
              animate={{ scale: isStarred ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Star className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isStarred && "fill-yellow-400")} />
            </motion.div>
            <span className="font-mono text-[10px] sm:text-xs">{repo.stargazers_count}</span>
          </motion.button>

          <div 
            className="flex items-center gap-1 w-[85px] sm:w-24 shrink-0 cursor-pointer hover:text-primary transition-colors"
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
              <span className="font-mono text-[10px] sm:text-xs truncate">
                {collabCount !== null 
                  ? `${collabCount} ${collabCount === 1 ? 'member' : 'members'}` 
                  : isContribution ? 'Public' : 'Members'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <HardDrive className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span className="font-mono text-[10px] sm:text-xs">{formatSize(repo.size)}</span>
          </div>
          
          <div className="flex items-center gap-1 ml-auto md:ml-0 whitespace-nowrap shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span className="font-mono text-[10px] sm:text-xs">{formatDistanceToNow(repo.updated_at)}</span>
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
  
  const isStarred = favoritedIds.includes(repo.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      transition={{ delay: Math.min(index * 0.01, 0.2), duration: 0.25, type: 'spring', stiffness: 200, damping: 22 }}
      className={cn(
        "group relative flex flex-col justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer h-48 overflow-hidden shadow-sm hover:shadow-md",
        isSelected 
          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
          : "border-white/[0.06] bg-neutral-900/40 hover:bg-neutral-800/40 hover:border-white/10"
      )}
      onClick={() => onToggle(repo.id)}
    >
      <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
      </div>

      <div className="flex flex-col gap-1 pr-8 min-w-0">
        <h3 className="font-mono font-medium text-sm sm:text-base truncate text-white group-hover:text-primary transition-colors flex items-center gap-1.5 max-w-full">
          <span className="truncate">{repo.name}</span>
          {!isContribution && (
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all select-none cursor-pointer shrink-0 ml-1 h-5 px-2 text-[9px] font-bold uppercase tracking-wider shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleInvite();
              }}
            >
              <UserPlus className="h-2.5 w-2.5 text-primary" /> Invite
            </Button>
          )}
        </h3>
        {isContribution && (
          <span className="block text-[10px] font-normal text-muted-foreground">
            by {repo.owner.login}
          </span>
        )}
      </div>
        
      <div className="flex flex-wrap gap-1.5">
        {repo.private ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 px-2 h-5 text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10">
            <Lock className="h-2.5 w-2.5" /> Private
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 px-2 h-5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10">
            <Unlock className="h-2.5 w-2.5" /> Public
          </span>
        )}

        {repo.archived && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 px-2 h-5 text-[9px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10">
            <Archive className="h-2.5 w-2.5" /> Archived
          </span>
        )}
        
        {repo.fork && (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 px-2 h-5 text-[9px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10">
            <GitFork className="h-2.5 w-2.5" /> Fork
          </span>
        )}
      </div>

      {repo.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {repo.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground mt-auto pt-3 border-t border-white/[0.04]">
        {repo.language ? (
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="h-1.5 w-1.5 rounded-full shrink-0 relative flex">
              <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", getLanguageColor(repo.language))} />
              <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", getLanguageColor(repo.language))} />
            </span>
            <span className="truncate text-white/90">{repo.language}</span>
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
              <span className="font-mono text-[10px] sm:text-xs">
                {collabCount !== null 
                  ? collabCount 
                  : isContribution ? 'Public' : 'Members'}
              </span>
            )}
          </div>
          
          <motion.button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(repo.id);
            }}
            whileTap={{ scale: 0.8 }}
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-none p-0 focus:outline-none hover:text-yellow-400",
              isStarred ? "text-yellow-400" : "text-muted-foreground"
            )}
            title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
          >
            <motion.div
              animate={{ scale: isStarred ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Star className={cn("h-3.5 w-3.5 transition-transform", isStarred && "fill-yellow-400")} />
            </motion.div>
            <span className="font-mono text-[10px] sm:text-xs">{repo.stargazers_count}</span>
          </motion.button>
          
          <div className="flex items-center gap-1" title={formatDistanceToNow(repo.updated_at)}>
            <Clock className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
