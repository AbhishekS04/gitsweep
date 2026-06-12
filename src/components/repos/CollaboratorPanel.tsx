import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, UserPlus, Trash2, Users, Loader2, Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  fetchRepoCollaborators, 
  addRepoCollaborator, 
  removeRepoCollaborator,
  searchUsers,
  fetchRepoInvitations,
  cancelRepoInvitation,
  fetchAuthenticatedUserFollowing
} from '../../lib/github';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

interface GitHubInvitation {
  id: number;
  invitee: GitHubUser | null;
  email: string | null;
  created_at: string;
}

export interface CollaboratorPanelProps {
  owner: string;
  repoName: string;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export const CollaboratorPanel: React.FC<CollaboratorPanelProps> = ({ 
  owner, 
  repoName, 
  onClose,
  onCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [collaborators, setCollaborators] = useState<GitHubUser[]>([]);
  const [invitations, setInvitations] = useState<GitHubInvitation[]>([]);
  const [following, setFollowing] = useState<GitHubUser[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubUser[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Track individual loading states for invites/kicks/cancelations to provide clean micro-feedback
  const [actionLoading, setActionLoading] = useState<Record<string, 'invite' | 'kick' | 'cancel' | null>>({});

  const loadCollaborators = useCallback(async () => {
    // Defer execution to prevent synchronous state setting in useEffect
    await Promise.resolve();
    setLoadingCollaborators(true);
    try {
      const [collabs, invites] = await Promise.all([
        fetchRepoCollaborators(owner, repoName),
        fetchRepoInvitations(owner, repoName).catch((err) => {
          console.warn('Could not fetch invitations:', err);
          return [];
        })
      ]);
      setCollaborators(collabs as GitHubUser[]);
      setInvitations(invites as unknown as GitHubInvitation[]);
      if (onCountChange) {
        onCountChange(collabs.length);
      }
      // Dispatch global event to update counts across components
      window.dispatchEvent(new CustomEvent('repo-collab-updated', {
        detail: { owner, repoName, count: collabs.length }
      }));
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error('Failed to load collaborators', { 
        description: error.message || 'Check your access token scopes.' 
      });
    } finally {
      setLoadingCollaborators(false);
    }
  }, [owner, repoName, onCountChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCollaborators();
    }, 0);
    
    // Load authenticated user following list to suggest friends
    const loadFollowing = async () => {
      try {
        const data = await fetchAuthenticatedUserFollowing();
        setFollowing(data as GitHubUser[]);
      } catch (err) {
        console.warn('Could not load followed users:', err);
      }
    };
    loadFollowing();

    return () => clearTimeout(timer);
  }, [loadCollaborators]);

  // Debounced search for GitHub users
  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results as GitHubUser[]);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleInvite = async (username: string) => {
    setActionLoading(prev => ({ ...prev, [username]: 'invite' }));
    try {
      await addRepoCollaborator(owner, repoName, username);
      toast.success(`Invitation sent to ${username}`);
      loadCollaborators();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error(`Failed to invite ${username}`, {
        description: error.message || 'Make sure the user exists and you have admin access.'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [username]: null }));
    }
  };

  const handleKick = async (username: string) => {
    if (username === owner) {
      toast.error('Cannot remove the owner of the repository.');
      return;
    }

    setActionLoading(prev => ({ ...prev, [username]: 'kick' }));
    try {
      await removeRepoCollaborator(owner, repoName, username);
      toast.success(`${username} removed successfully`);
      loadCollaborators();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error(`Failed to remove ${username}`, {
        description: error.message || 'Check your repository permissions.'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [username]: null }));
    }
  };

  const handleCancelInvite = async (invitationId: number, username: string) => {
    setActionLoading(prev => ({ ...prev, [username]: 'cancel' }));
    try {
      await cancelRepoInvitation(owner, repoName, invitationId);
      toast.success(`Invitation to ${username} cancelled`);
      loadCollaborators();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error(`Failed to cancel invitation for ${username}`, {
        description: error.message || 'Check your repository permissions.'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [username]: null }));
    }
  };

  const isCollaborator = (username: string) => {
    return collaborators.some(c => c.login.toLowerCase() === username.toLowerCase());
  };

  const isPendingInvitee = (username: string) => {
    return invitations.some(i => i.invitee?.login.toLowerCase() === username.toLowerCase());
  };

  return (
    <div
      className="absolute inset-0 bg-background/95 backdrop-blur-sm p-5 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-primary" />
          <h4 className="font-mono text-sm font-bold text-foreground">
            {repoName}
          </h4>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex bg-accent/40 p-0.5 rounded-lg border border-border/10 shrink-0 mt-3 mb-3 gap-0.5">
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            "flex-1 text-xs py-1.5 rounded-md font-medium transition-all duration-200",
            activeTab === 'members'
              ? "bg-background text-foreground font-semibold shadow-sm border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-background/20"
          )}
        >
          Members ({collaborators.length + invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={cn(
            "flex-1 text-xs py-1.5 rounded-md font-medium transition-all duration-200",
            activeTab === 'add'
              ? "bg-background text-foreground font-semibold shadow-sm border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-background/20"
          )}
        >
          Invite Collaborator
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <AnimatePresence mode="wait">
          {activeTab === 'members' ? (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {loadingCollaborators ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading members...</span>
                </div>
              ) : collaborators.length === 0 && invitations.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  No members or pending invitations found.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active Collaborators */}
                  {collaborators.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
                        Active Members ({collaborators.length})
                      </div>
                      {collaborators.map((c) => (
                        <div 
                          key={c.id} 
                          className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 border border-border/20 group/item hover:border-border/60 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={c.avatar_url} 
                              alt={c.login} 
                              className="h-8 w-8 rounded-full border border-border/50 shrink-0"
                            />
                            <span className="text-xs font-mono truncate text-foreground/80 font-medium">
                              {c.login}
                            </span>
                            {c.login === owner && (
                              <span className="text-[9px] scale-90 px-1 py-0.2 rounded bg-primary/10 text-primary uppercase font-bold tracking-wider shrink-0">
                                Owner
                              </span>
                            )}
                          </div>
                          
                          {c.login !== owner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => handleKick(c.login)}
                              isLoading={actionLoading[c.login] === 'kick'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {invitations.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border/20">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 flex items-center justify-between">
                        <span>Pending Invites ({invitations.length})</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      </div>
                      {invitations.map((i) => {
                        const login = i.invitee?.login || i.email || 'Pending Invitee';
                        const avatar = i.invitee?.avatar_url || 'https://github.com/identicons/default.png';
                        return (
                          <div 
                            key={i.id} 
                            className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/15 group/item hover:border-yellow-500/40 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={avatar} 
                                alt={login} 
                                className="h-8 w-8 rounded-full border border-yellow-500/20 shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-mono truncate text-foreground/80 font-medium">
                                  {login}
                                </span>
                                <span className="text-[9px] text-yellow-600 font-medium">
                                  Invited {new Date(i.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => handleCancelInvite(i.id, login)}
                              isLoading={actionLoading[login] === 'cancel'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {/* Search Bar */}
              <div className="relative shrink-0 mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/80" />
                <input
                  type="text"
                  placeholder="Search GitHub username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border/60 bg-background/50 placeholder:text-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                />
              </div>

              {/* Direct Invite Row */}
              {searchQuery.trim() && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 shadow-sm shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-mono text-primary font-bold shrink-0 border border-primary/20">
                      {searchQuery.trim().slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-mono truncate text-foreground font-semibold">
                        {searchQuery.trim()}
                      </span>
                      <span className="text-[9px] text-primary font-medium">
                        Invite exact username
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold gap-1 rounded-md shadow-sm"
                    onClick={() => handleInvite(searchQuery.trim())}
                    isLoading={actionLoading[searchQuery.trim()] === 'invite'}
                  >
                    <UserPlus className="h-3 w-3" />
                    Invite Directly
                  </Button>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  searchQuery.trim() ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No users match "{searchQuery}"
                    </div>
                  ) : following.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 mb-1">
                        Suggestions (People you follow)
                      </div>
                      {following.map((u) => {
                        const isAlreadyCollaborator = isCollaborator(u.login);
                        const isPending = isPendingInvitee(u.login);
                        return (
                          <div 
                            key={u.id} 
                            className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 border border-border/10 hover:border-border/40 hover:bg-accent/20 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={u.avatar_url} 
                                alt={u.login} 
                                className="h-8 w-8 rounded-full shrink-0 border border-border/40"
                              />
                              <span className="text-xs font-mono truncate text-foreground/80">
                                {u.login}
                              </span>
                            </div>

                            {isAlreadyCollaborator ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 shrink-0">
                                <Check className="h-3 w-3" /> Member
                              </span>
                            ) : isPending ? (
                              <span className="flex items-center gap-1 text-[10px] text-yellow-600 font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 shrink-0">
                                Pending
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2.5 text-[10px] font-bold text-primary hover:bg-primary/10 shrink-0"
                                onClick={() => handleInvite(u.login)}
                                isLoading={actionLoading[u.login] === 'invite'}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Invite
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-muted-foreground flex flex-col items-center gap-2">
                      <UserPlus className="h-5 w-5 opacity-40 text-primary" />
                      Type a username to start inviting.
                    </div>
                  )
                ) : (
                  [...searchResults]
                    .sort((a, b) => {
                      const aFollowed = following.some(f => f.login.toLowerCase() === a.login.toLowerCase());
                      const bFollowed = following.some(f => f.login.toLowerCase() === b.login.toLowerCase());
                      if (aFollowed && !bFollowed) return -1;
                      if (!aFollowed && bFollowed) return 1;
                      return 0;
                    })
                    .map((u) => {
                      const isAlreadyCollaborator = isCollaborator(u.login);
                      const isPending = isPendingInvitee(u.login);
                      const isFollowed = following.some(f => f.login.toLowerCase() === u.login.toLowerCase());
                      return (
                        <div 
                          key={u.id} 
                          className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 border border-border/10 hover:border-border/40 hover:bg-accent/20 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={u.avatar_url} 
                              alt={u.login} 
                              className="h-8 w-8 rounded-full shrink-0 border border-border/40"
                            />
                            <span className="text-xs font-mono truncate text-foreground/80 flex items-center gap-1.5">
                              {u.login}
                              {isFollowed && (
                                <span className="text-[9px] scale-90 px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold tracking-wide shrink-0">
                                  Following
                                </span>
                              )}
                            </span>
                          </div>

                          {isAlreadyCollaborator ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 shrink-0">
                              <Check className="h-3 w-3" /> Member
                            </span>
                          ) : isPending ? (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-600 font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 shrink-0">
                              Pending
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-[10px] font-bold text-primary hover:bg-primary/10 shrink-0"
                              onClick={() => handleInvite(u.login)}
                              isLoading={actionLoading[u.login] === 'invite'}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Invite
                            </Button>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const CollaboratorModal: React.FC<CollaboratorPanelProps> = ({
  owner,
  repoName,
  onClose,
  onCountChange
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-md h-[460px] bg-background border border-border/60 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] shadow-primary/10"
        onClick={(e) => e.stopPropagation()}
      >
        <CollaboratorPanel
          owner={owner}
          repoName={repoName}
          onClose={onClose}
          onCountChange={onCountChange}
        />
      </motion.div>
    </div>
  );
};
