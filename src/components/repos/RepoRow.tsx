import React, { useState, useEffect } from 'react';
import type { Repo } from '../../lib/github';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  Lock, Unlock, Archive, GitFork,
  Star, HardDrive, Clock, Users, UserPlus,
  Loader2, GitBranch, Globe, ExternalLink,
  MousePointer2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSelectionStore } from '../../store/selectionStore';
import { fetchRepoCollaborators } from '../../lib/github';
import { CollaboratorPanel } from './CollaboratorPanel';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '../../lib/utils';

interface RepoItemProps {
  repo: Repo;
  isSelected: boolean;
  onToggle: (id: number) => void;
  index: number;
}

/* ── helpers ────────────────────────────────────────── */

const formatDistanceToNow = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  if (dy < 30) return `${dy}d ago`;
  const mo = Math.floor(dy / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

const formatSize = (kb: number) =>
  kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;

const LANG_COLORS: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  TypeScript:  { dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  JavaScript:  { dot: '#facc15', bg: 'rgba(250,204,21,0.1)',  text: '#fde047', border: 'rgba(250,204,21,0.25)' },
  Python:      { dot: '#6366f1', bg: 'rgba(99,102,241,0.1)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
  Go:          { dot: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  text: '#67e8f9', border: 'rgba(34,211,238,0.25)' },
  Rust:        { dot: '#f97316', bg: 'rgba(249,115,22,0.1)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  Java:        { dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  CSS:         { dot: '#a855f7', bg: 'rgba(168,85,247,0.1)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  HTML:        { dot: '#ea580c', bg: 'rgba(234,88,12,0.1)',   text: '#fb923c', border: 'rgba(234,88,12,0.25)' },
  Ruby:        { dot: '#dc2626', bg: 'rgba(220,38,38,0.1)',   text: '#f87171', border: 'rgba(220,38,38,0.25)' },
  Shell:       { dot: '#22c55e', bg: 'rgba(34,197,94,0.1)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  'C++':       { dot: '#ec4899', bg: 'rgba(236,72,153,0.1)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  'C#':        { dot: '#16a34a', bg: 'rgba(22,163,74,0.1)',   text: '#4ade80', border: 'rgba(22,163,74,0.25)' },
  C:           { dot: '#6b7280', bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
};
const getLang = (l: string | null) =>
  l && LANG_COLORS[l] ? LANG_COLORS[l] : { dot: '#6b7280', bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)' };

const GRADS = [
  ['#6366f1','#8b5cf6'], ['#3b82f6','#06b6d4'], ['#10b981','#22d3ee'],
  ['#f59e0b','#ef4444'], ['#ec4899','#8b5cf6'], ['#14b8a6','#3b82f6'],
  ['#f97316','#eab308'], ['#84cc16','#22d3ee'],
];
const grad = (name: string) => GRADS[name.charCodeAt(0) % GRADS.length];

const spring = { type: 'spring', stiffness: 300, damping: 30 } as const;

/* ── DataRow ── */
const DataRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-b-0">
    <div className="flex items-center gap-2.5 text-neutral-400 shrink-0">
      <span className="text-neutral-500">{icon}</span>
      <span className="text-xs font-medium text-neutral-400">{label}</span>
    </div>
    <div className="flex justify-end items-center min-w-0 flex-1">{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────
   RepoRow — list-view card (ProfileCard style)
───────────────────────────────────────────────────── */
export const RepoRow: React.FC<RepoItemProps> = ({ repo, isSelected, onToggle, index }) => {
  const { user } = useAuthStore();
  const isContribution = repo.owner.login !== user?.login;
  const { activeInviteRepoId, setActiveInviteRepoId, favoritedIds, toggleFavorite } = useSelectionStore();

  const isInviteOpen = activeInviteRepoId === repo.id;
  const toggleInvite = () => setActiveInviteRepoId(isInviteOpen ? null : repo.id);

  const [collabCount, setCollabCount] = useState<number | null>(null);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isStarred = favoritedIds.includes(repo.id);
  const ls = getLang(repo.language);
  const [g0, g1] = grad(repo.name);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingCollabs(true);
      try {
        const d = await fetchRepoCollaborators(repo.owner.login, repo.name);
        if (alive) setCollabCount(d.length);
      } catch { /* silent */ }
      finally { if (alive) setLoadingCollabs(false); }
    })();
    return () => { alive = false; };
  }, [repo.owner.login, repo.name]);

  useEffect(() => {
    const h = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail.owner === repo.owner.login && ce.detail.repoName === repo.name)
        setCollabCount(ce.detail.count);
    };
    window.addEventListener('repo-collab-updated', h);
    return () => window.removeEventListener('repo-collab-updated', h);
  }, [repo.owner.login, repo.name]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.25, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <motion.div
        layout
        transition={spring}
        className={cn(
          "rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden",
          isSelected
            ? "border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : "border-white/10 bg-zinc-950/80 shadow-md hover:border-white/20 hover:shadow-2xl hover:-translate-y-0.5"
        )}
      >
        {/* ── Collapsed Header ── */}
        <div
          onClick={() => setIsExpanded(v => !v)}
          className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer min-h-[56px] hover:bg-white/[0.02] active:bg-white/[0.04] transition-all duration-200 select-none"
        >
          {/* Left: checkbox + avatar + name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center">
              <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
            </div>

            {/* GitHub owner avatar */}
            <div 
              className="shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              style={{
                width: 36, height: 36,
                background: `linear-gradient(135deg, ${g0}, ${g1})`,
              }}
            >
              <img
                src={`https://github.com/${repo.owner.login}.png?size=80`}
                alt={repo.owner.login}
                className="w-full h-full object-cover block"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Name only */}
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-sm font-semibold text-neutral-100 font-mono tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                {repo.name}
              </span>
              {isContribution && (
                <span className="text-xs text-neutral-500 font-sans tracking-tight shrink-0">
                  by {repo.owner.login}
                </span>
              )}
            </div>
          </div>

          {/* Right: badges + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 select-none">
              {repo.archived && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  <Archive size={11} /> Arch
                </span>
              )}
              {repo.fork && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  <GitFork size={11} /> Fork
                </span>
              )}
              {repo.private ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  <Lock size={11} /> Priv
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Unlock size={11} /> Pub
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 shrink-0 transition-all duration-200"
            >
              <ChevronUp size={16} />
            </motion.div>
          </div>
        </div>

        {/* ── Expanded Details ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="border-t border-white/5 overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-0">
                {/* Live Link — only shown if repo.homepage is set */}
                {repo.homepage && (
                  <DataRow icon={<ExternalLink size={15} />} label="Live link">
                    <a
                      href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200 select-none max-w-[200px] truncate"
                    >
                      {repo.homepage.replace(/^https?:\/\//, '')}
                      <ExternalLink size={10} />
                    </a>
                  </DataRow>
                )}

                {/* Language */}
                {repo.language && (
                  <DataRow icon={<MousePointer2 size={15} />} label="Language">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      borderRadius: 999, border: `1px solid ${ls.border}`,
                      padding: '2px 10px', fontSize: 12, fontWeight: 600,
                      color: ls.text, background: ls.bg,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: ls.dot }} />
                      {repo.language}
                    </span>
                  </DataRow>
                )}

                {/* Stars */}
                <DataRow icon={<Star size={15} />} label="Stars">
                  <motion.button
                    onClick={e => { e.stopPropagation(); toggleFavorite(repo.id); }}
                    whileTap={{ scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 outline-none select-none transition-colors duration-200"
                    style={{ color: isStarred ? '#facc15' : '#d4d4d8' }}
                  >
                    <Star size={14} style={{ fill: isStarred ? '#facc15' : 'none' }} />
                    <span className="text-sm font-semibold font-mono">
                      {repo.stargazers_count}
                    </span>
                  </motion.button>
                </DataRow>

                {/* Collaborators */}
                <DataRow icon={<Users size={15} />} label="Collaborators">
                  {loadingCollabs
                    ? <Loader2 size={14} className="animate-spin text-neutral-500" />
                    : <span className="text-sm font-semibold text-neutral-300 font-mono">
                        {collabCount !== null ? `${collabCount}` : '—'}
                      </span>
                  }
                </DataRow>

                {/* Size */}
                <DataRow icon={<HardDrive size={15} />} label="Size">
                  <span className="text-sm font-semibold text-neutral-300 font-mono">
                    {formatSize(repo.size)}
                  </span>
                </DataRow>

                {/* Default branch */}
                <DataRow icon={<GitBranch size={15} />} label="Default branch">
                  <span className="text-xs font-semibold font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                    {repo.default_branch}
                  </span>
                </DataRow>

                {/* Updated */}
                <DataRow icon={<Clock size={15} />} label="Last updated">
                  <span className="text-sm font-semibold text-neutral-300 font-mono">
                    {formatDistanceToNow(repo.updated_at)}
                  </span>
                </DataRow>

                {/* Contribution owner */}
                {isContribution && (
                  <DataRow icon={<Users size={15} />} label="Owner">
                    <span className="text-sm font-semibold text-neutral-300 font-mono">
                      {repo.owner.login}
                    </span>
                  </DataRow>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
                  <a
                    href={`https://github.com/${repo.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/15 transition-all duration-200 select-none text-center"
                  >
                    <Globe size={13} /> Open on GitHub <ExternalLink size={10} />
                  </a>

                  {!isContribution && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleInvite(); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/30 px-3 py-2.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40 transition-all duration-200 select-none cursor-pointer"
                    >
                      <UserPlus size={13} /> Invite
                    </button>
                  )}
                </div>
              </div>

              {/* CollaboratorPanel */}
              <AnimatePresence>
                {isInviteOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 320, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    className="overflow-hidden border-t border-white/5 bg-black/25"
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export { RepoRow as RepoCard };
