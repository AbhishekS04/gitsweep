import React, { useState, useEffect } from 'react';
import type { Repo } from '../../lib/github';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  Lock, Unlock, Archive, GitFork,
  Star, HardDrive, Clock, Users, UserPlus,
  Loader2, GitBranch, Globe, ExternalLink,
  ExternalLink as LiveLinkIcon, MousePointer2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSelectionStore } from '../../store/selectionStore';
import { fetchRepoCollaborators } from '../../lib/github';
import { CollaboratorPanel } from './CollaboratorPanel';
import { Checkbox } from '../ui/Checkbox';

interface RepoProfileCardProps {
  repo: Repo;
  isSelected: boolean;
  onToggle: (id: number) => void;
  index: number;
}

/* ── helpers (same as RepoRow) ── */
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
const formatSize = (kb: number) => kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;

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

const DataRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '5px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#71717a', flexShrink: 0 }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#71717a', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0, flex: 1 }}>{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────
   RepoProfileCard — grid-view card (ProfileCard style)
───────────────────────────────────────────────────── */
export const RepoProfileCard: React.FC<RepoProfileCardProps> = ({ repo, isSelected, onToggle, index }) => {
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.28, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <motion.div
        layout
        transition={spring}
        style={{
          borderRadius: 16,
          border: isSelected ? '1.5px solid rgba(99,102,241,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
          background: isSelected ? 'rgba(99,102,241,0.06)' : 'rgba(18,18,22,0.9)',
          boxShadow: isSelected ? '0 0 24px rgba(99,102,241,0.12)' : '0 2px 12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* ── Collapsed Header ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '14px 14px', cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(v => !v)}
        >
          {/* Left: checkbox + avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
              <Checkbox checked={isSelected} onCheckedChange={() => onToggle(repo.id)} />
            </div>

            {/* GitHub owner avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              flexShrink: 0, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              background: `linear-gradient(135deg, ${g0}, ${g1})`,
            }}>
              <img
                src={`https://github.com/${repo.owner.login}.png?size=80`}
                alt={repo.owner.login}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Name only */}
            <span style={{
              fontSize: 15, fontWeight: 600, color: '#ededed',
              fontFamily: 'monospace', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {repo.name}
            </span>
          </div>

          {/* Right: sparkline + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 64 }}>
              <svg viewBox="0 0 80 20" fill="none" style={{ width: '100%', height: 'auto' }}>
                <path
                  d="M2 18C15 15 25 5 45 8C65 11 70 2 78 2"
                  stroke={isStarred ? '#facc15' : g0}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#71717a', flexShrink: 0,
              }}
            >
              <ChevronUp size={18} />
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
              style={{
                borderTop: '1.4px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.018)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Live Link — only shown if repo.homepage is set */}
                {repo.homepage && (
                  <DataRow icon={<LiveLinkIcon size={15} />} label="Live link">
                    <a
                      href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2px 10px',
                        fontSize: 12, fontWeight: 500,
                        color: '#a1a1aa',
                        background: 'rgba(255,255,255,0.04)',
                        textDecoration: 'none',
                        maxWidth: 180, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#e4e4e7'; el.style.background = 'rgba(255,255,255,0.09)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#a1a1aa'; el.style.background = 'rgba(255,255,255,0.04)'; }}
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

                {/* Visibility */}
                <DataRow icon={repo.private ? <Lock size={15} /> : <Unlock size={15} />} label="Visibility">
                  {repo.private ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999,
                      border: '1px solid rgba(245,158,11,0.3)', padding: '2px 10px',
                      fontSize: 12, fontWeight: 600, color: '#fbbf24', background: 'rgba(245,158,11,0.1)',
                    }}>
                      <Lock size={11} /> Private
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999,
                      border: '1px solid rgba(34,197,94,0.3)', padding: '2px 10px',
                      fontSize: 12, fontWeight: 600, color: '#4ade80', background: 'rgba(34,197,94,0.1)',
                    }}>
                      <Unlock size={11} /> Public
                    </span>
                  )}
                </DataRow>

                {/* Stars */}
                <DataRow icon={<Star size={15} />} label="Stars">
                  <motion.button
                    onClick={e => { e.stopPropagation(); toggleFavorite(repo.id); }}
                    whileTap={{ scale: 0.8 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      cursor: 'pointer', background: 'transparent', border: 'none',
                      padding: 0, outline: 'none', color: isStarred ? '#facc15' : '#d4d4d8',
                    }}
                  >
                    <Star size={14} style={{ fill: isStarred ? '#facc15' : 'none' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: isStarred ? '#facc15' : '#d4d4d8' }}>
                      {repo.stargazers_count}
                    </span>
                  </motion.button>
                </DataRow>

                {/* Collaborators */}
                <DataRow icon={<Users size={15} />} label="Collaborators">
                  {loadingCollabs
                    ? <Loader2 size={14} className="animate-spin" style={{ color: '#71717a' }} />
                    : <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d8', fontFamily: 'monospace' }}>
                        {collabCount !== null ? `${collabCount}` : '—'}
                      </span>
                  }
                </DataRow>

                {/* Size */}
                <DataRow icon={<HardDrive size={15} />} label="Size">
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d8', fontFamily: 'monospace' }}>
                    {formatSize(repo.size)}
                  </span>
                </DataRow>

                {/* Branch */}
                <DataRow icon={<GitBranch size={15} />} label="Default branch">
                  <span style={{
                    fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
                    color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
                    border: '1px solid rgba(167,139,250,0.22)',
                    borderRadius: 999, padding: '2px 10px',
                  }}>
                    {repo.default_branch}
                  </span>
                </DataRow>

                {/* Updated */}
                <DataRow icon={<Clock size={15} />} label="Last updated">
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d8', fontFamily: 'monospace' }}>
                    {formatDistanceToNow(repo.updated_at)}
                  </span>
                </DataRow>

                {/* Archived / Fork */}
                {(repo.archived || repo.fork) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {repo.archived && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999,
                        border: '1px solid rgba(244,63,94,0.3)', padding: '3px 10px',
                        fontSize: 11, fontWeight: 700, color: '#fb7185', background: 'rgba(244,63,94,0.1)',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        <Archive size={10} /> Archived
                      </span>
                    )}
                    {repo.fork && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999,
                        border: '1px solid rgba(14,165,233,0.3)', padding: '3px 10px',
                        fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(14,165,233,0.1)',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        <GitFork size={10} /> Fork
                      </span>
                    )}
                  </div>
                )}

                {/* Contribution owner */}
                {isContribution && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: '#52525b' }}>Owner: </span>
                    <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace' }}>{repo.owner.login}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <a
                    href={`https://github.com/${repo.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 12px', fontSize: 12, fontWeight: 600,
                      color: '#a1a1aa', background: 'rgba(255,255,255,0.04)',
                      textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.09)'; el.style.color = '#e4e4e7'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#a1a1aa'; }}
                  >
                    <Globe size={13} /> GitHub <ExternalLink size={11} />
                  </a>

                  {!isContribution && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleInvite(); }}
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: 6, borderRadius: 9, border: '1px solid rgba(99,102,241,0.35)',
                        padding: '8px 12px', fontSize: 12, fontWeight: 600,
                        color: '#818cf8', background: 'rgba(99,102,241,0.08)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
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
                    style={{
                      overflow: 'hidden',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(0,0,0,0.25)',
                    }}
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
