import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Inbox, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listInvitations, acceptInvitation, declineInvitation } from '../../lib/github';
import { useRepoStore } from '../../store/repoStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export const NotificationBell: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const { fetchRepos } = useRepoStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadInvites = async () => {
    try {
      const data = await listInvitations();
      setInvites(data);
    } catch (e) {
      console.error('Failed to load invitations', e);
    }
  };

  useEffect(() => {
    loadInvites();
    const timer = setInterval(loadInvites, 30000); // Poll every 30s
    return () => clearInterval(timer);
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
        {invites.length > 0 && (
          <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
        )}
      </motion.button>

      {/* Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            data-lenis-prevent
            className="absolute right-0 top-full mt-2.5 w-80 max-h-[380px] overflow-y-auto bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] z-50 p-4 font-mono select-none"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {invites.length} Pending
              </span>
            </div>

            {/* Content List */}
            {invites.length === 0 ? (
              <div className="py-8 text-center opacity-40">
                <Inbox size={28} className="mx-auto mb-2 text-white/80" />
                <p className="text-xs text-white/80">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3"
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
                        className="flex-1 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50"
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
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        <X size={12} strokeWidth={2.5} />
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
