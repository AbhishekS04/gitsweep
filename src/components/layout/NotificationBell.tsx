import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Check, X, Inbox, Loader2, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listInvitations, acceptInvitation, declineInvitation, deleteRepo } from '../../lib/github';
import { useRepoStore } from '../../store/repoStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface GitHubInvite {
  id: number;
  repository: {
    full_name: string;
  };
  inviter: {
    login: string;
    avatar_url: string;
  };
}

const DEVELOPER_QUOTES = [
  "Code is like humor. When you have to explain it, it’s bad. – Cory House",
  "Fix the cause, not the symptom. – Steve Maguire",
  "Before software can be reusable it first has to be usable. – Ralph Johnson",
  "Simplicity is the soul of efficiency. – Austin Freeman",
  "Make it work, make it right, make it fast. – Kent Beck",
  "First, solve the problem. Then, write the code. – John Johnson",
  "Experience is the name everyone gives to their mistakes. – Oscar Wilde",
  "Java is to JavaScript what car is to Carpet. – Chris Heilmann",
  "Sometimes it pays to stay in bed on Monday, rather than debugging Monday's code. – Dan Salomon",
  "Talk is cheap. Show me the code. – Linus Torvalds",
  "Programs must be written for people to read, and only incidentally for machines to execute. – Harold Abelson",
  "Truth can only be found in one place: the code. – Robert C. Martin"
];

export const NotificationBell: React.FC = () => {
  const [invites, setInvites] = useState<GitHubInvite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const { fetchRepos, repos, removeReposLocally } = useRepoStore();
  const { user } = useAuthStore();
  const { telegramBotToken, telegramChatId, setSettingsModalOpen } = useSettingsStore();
  const hasTelegramSetup = !!(telegramBotToken && telegramChatId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mountedAt] = useState(() => Date.now());

  // Telegram setup notification card detection
  const backupNotice = useMemo(() => {
    if (!hasTelegramSetup) {
      return {
        id: 'telegram-backup-setup',
        title: 'Enable Telegram Backup',
        description: "Auto-backup deleted/archived repos as ZIPs to your private Telegram chat before they're gone forever."
      };
    }
    return null;
  }, [hasTelegramSetup]);

  // 0 KB / Empty or low activity repository suggestion detection (pure programmatic heuristics)
  const cleanupSuggestions = useMemo(() => {
    if (!user) return [];
    const oneHourAgo = mountedAt - 60 * 60 * 1000;
    return repos.filter((repo) => {
      const isOwner = repo.owner.login === user.login;
      const isNotFork = !repo.fork;
      const isEmpty = repo.size <= 4;
      const isInactive = repo.stargazers_count === 0;
      const isOldEnough = new Date(repo.updated_at).getTime() < oneHourAgo;

      return isOwner && isNotFork && isEmpty && isInactive && isOldEnough;
    });
  }, [repos, user, mountedAt]);

  const loadInvites = async () => {
    try {
      const data = await listInvitations();
      setInvites(data as unknown as GitHubInvite[]);
    } catch (e) {
      console.error('Failed to load invitations', e);
    }
  };

  // Notification Permission Request & welcome trigger
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted' && !sessionStorage.getItem('gitsweep-quote-shown')) {
            const randomIndex = Math.floor(Math.random() * DEVELOPER_QUOTES.length);
            new Notification('GitSweep Inspiration', {
              body: DEVELOPER_QUOTES[randomIndex],
            });
            sessionStorage.setItem('gitsweep-quote-shown', 'true');
          }
        });
      }
    }
  }, []);

  // Quote Notification scheduler (Every 2 hours + Instant trigger on load if already permitted)
  useEffect(() => {
    if (!('Notification' in window)) return;

    const triggerQuote = () => {
      if (Notification.permission !== 'granted') return;
      const randomIndex = Math.floor(Math.random() * DEVELOPER_QUOTES.length);
      const quote = DEVELOPER_QUOTES[randomIndex];
      new Notification('GitSweep Inspiration', {
        body: quote,
      });
    };

    if (Notification.permission === 'granted' && !sessionStorage.getItem('gitsweep-quote-shown')) {
      triggerQuote();
      sessionStorage.setItem('gitsweep-quote-shown', 'true');
    }

    const quoteTimer = setInterval(triggerQuote, 2 * 60 * 60 * 1000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Web Notification Trigger
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const saved = localStorage.getItem('gitsweep-notified-ids');
    const notified = new Set<string>(saved ? JSON.parse(saved) : []);
    let updated = false;

    invites.forEach((invite) => {
      const idStr = `invite-${invite.id}`;
      if (!notified.has(idStr)) {
        new Notification('New GitSweep Invitation', {
          body: `You have been invited to collaborate on ${invite.repository.full_name} by ${invite.inviter.login}.`,
          icon: invite.inviter.avatar_url,
        });
        notified.add(idStr);
        updated = true;
      }
    });

    cleanupSuggestions.forEach((repo) => {
      const idStr = `suggest-${repo.id}`;
      if (!notified.has(idStr)) {
        new Notification('GitSweep Cleanup Suggestion', {
          body: `"${repo.name}" is empty/inactive. Suggesting deletion to free up space.`,
        });
        notified.add(idStr);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('gitsweep-notified-ids', JSON.stringify(Array.from(notified)));
    }
  }, [invites, cleanupSuggestions]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadInvites();
    }, 0);
    const timer = setInterval(loadInvites, 30000); // Poll every 30s
    return () => {
      clearTimeout(loadTimer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (id: number, type: 'accept' | 'decline') => {
    setActioningId(id);
    try {
      if (type === 'accept') {
        await acceptInvitation(id);
        toast.success('Invitation accepted');
        fetchRepos();
      } else {
        await declineInvitation(id);
        toast.success('Invitation declined');
      }
      await loadInvites();
    } catch (e) {
      toast.error(`Failed to ${type} invitation`);
      console.error(`Failed to ${type} invitation`, e);
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteSuggestion = async (repoId: number, owner: string, name: string) => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete the repository "${name}"? This action is permanent and cannot be undone.`);
    if (!confirmDelete) return;

    setActioningId(repoId);
    try {
      await deleteRepo(owner, name);
      toast.success(`Repository "${name}" deleted successfully`);
      removeReposLocally([repoId]);
    } catch (e) {
      toast.error(`Failed to delete "${name}"`);
      console.error(`Failed to delete "${name}"`, e);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Redesigned Circular Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent focus:outline-none",
          isOpen ? "text-white bg-white/8" : "text-white/40 hover:text-white/80 hover:bg-white/8"
        )}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {(invites.length > 0 || cleanupSuggestions.length > 0 || backupNotice) && (
          <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
        )}
      </motion.button>

      {/* Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            data-lenis-prevent
            className="fixed inset-x-4 sm:absolute sm:inset-x-auto sm:right-0 sm:w-[480px] top-[72px] sm:top-full mt-2.5 max-h-[480px] overflow-y-auto bg-neutral-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] z-50 p-6 font-mono select-none origin-top sm:origin-top-right"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {invites.length + cleanupSuggestions.length + (backupNotice ? 1 : 0)} Pending
              </span>
            </div>

            {/* Content List */}
            {invites.length === 0 && cleanupSuggestions.length === 0 && !backupNotice ? (
              <div className="py-8 text-center opacity-40">
                <Inbox size={28} className="mx-auto mb-2 text-white/80" />
                <p className="text-xs text-white/80">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {/* Backup Setup Notice */}
                {backupNotice && (
                  <div
                    key="telegram-backup-setup"
                    className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col gap-3 text-left"
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 shrink-0">
                        <Send size={14} />
                      </div>
                      <div className="overflow-hidden flex flex-col gap-0.5">
                        <p className="text-[11px] font-bold text-blue-400 truncate leading-tight">
                          {backupNotice.title}
                        </p>
                        <p className="text-[9px] text-white/75 leading-relaxed mt-1">
                          {backupNotice.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSettingsModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="flex-1 h-7.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
                      >
                        Set Up Backup
                      </button>
                    </div>
                  </div>
                )}

                {/* Invitations */}
                {invites.map((invite) => (
                  <div
                    key={`invite-${invite.id}`}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3"
                  >
                    <div className="flex gap-2.5 items-start">
                      <img
                        src={invite.inviter.avatar_url}
                        className="w-7 h-7 rounded-md border border-white/10 shrink-0"
                        alt=""
                      />
                      <div className="overflow-hidden flex flex-col gap-0.5">
                        <p className="text-[11px] font-bold text-white/90 truncate leading-tight">
                          {invite.repository.full_name}
                        </p>
                        <p className="text-[9px] text-white/45 leading-none">
                          Invited by {invite.inviter.login}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(invite.id, 'accept')}
                        disabled={actioningId === invite.id}
                        className="flex-1 h-7.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50"
                      >
                        {actioningId === invite.id ? (
                          <Loader2 size={12} className="animate-spin text-white" />
                        ) : (
                          <Check size={12} strokeWidth={2.5} />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(invite.id, 'decline')}
                        disabled={actioningId === invite.id}
                        className="w-7.5 h-7.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {cleanupSuggestions.map((repo) => (
                  <div
                    key={`suggest-${repo.id}`}
                    className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3"
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-500 shrink-0">
                        <Trash2 size={14} />
                      </div>
                      <div className="overflow-hidden flex flex-col gap-0.5">
                        <p className="text-[11px] font-bold text-amber-400 truncate leading-tight">
                          Cleanup Suggestion
                        </p>
                        <p className="text-[11px] font-bold text-white/90 truncate leading-tight mt-0.5">
                          {repo.name}
                        </p>
                        <p className="text-[9px] text-white/45 leading-tight">
                          Repository is empty ({repo.size} KB) and inactive.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteSuggestion(repo.id, repo.owner.login, repo.name)}
                        disabled={actioningId === repo.id}
                        className="flex-1 h-7.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50"
                      >
                        {actioningId === repo.id ? (
                          <Loader2 size={12} className="animate-spin text-white" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete Repo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
