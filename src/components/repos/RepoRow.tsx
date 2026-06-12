
import React, { useState, useEffect } from 'react';
import type { Repo } from '../../lib/github';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  Lock, Unlock, Archive, GitFork,
  Star, HardDrive, Clock, Users, UserPlus,
  Loader2, GitBranch, Globe, ExternalLink,
  Code2,
  Pin,
} from 'lucide-react';
import {
  SiTypescript,
  SiJavascript,
  SiPython,
  SiGo,
  SiRust,
  SiCss,
  SiHtml5,
  SiRuby,
  SiGnubash,
  SiCplusplus,
  SiC,
  SiVuedotjs,
  SiSvelte,
  SiReact,
  SiSass,
  SiPhp,
  SiKotlin,
  SiSwift,
  SiDart,
  SiDocker,
} from 'react-icons/si';
import { DiJava } from 'react-icons/di';
import { TbBrandCSharp } from 'react-icons/tb';
import { useAuthStore } from '../../store/authStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useTransferStore } from '../../store/transferStore';
import { toast } from 'sonner';
import { fetchRepoCollaborators, fetchRepoLanguages } from '../../lib/github';
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

const getLanguageIcon = (lang: string | null, size: number = 18): React.ReactNode => {
  if (!lang) return null;
  const normalized = lang.toLowerCase();
  switch (normalized) {
    case 'typescript':
      return <SiTypescript size={size} className="shrink-0 text-[#3178c6]" />;
    case 'javascript':
      return <SiJavascript size={size} className="shrink-0 text-[#f7df1e]" />;
    case 'python':
      return <SiPython size={size} className="shrink-0 text-[#3776ab]" />;
    case 'go':
      return <SiGo size={size} className="shrink-0 text-[#00add8]" />;
    case 'rust':
      return <SiRust size={size} className="shrink-0 text-[#ea4a2b]" />;
    case 'java':
      return <DiJava size={size + 2} className="shrink-0 text-[#f89820]" />;
    case 'css':
      return <SiCss size={size} className="shrink-0 text-[#1572b6]" />;
    case 'html':
      return <SiHtml5 size={size} className="shrink-0 text-[#e34f26]" />;
    case 'ruby':
      return <SiRuby size={size} className="shrink-0 text-[#cc342d]" />;
    case 'shell':
    case 'bash':
      return <SiGnubash size={size} className="shrink-0 text-[#4eaa25]" />;
    case 'c++':
      return <SiCplusplus size={size} className="shrink-0 text-[#00599c]" />;
    case 'c#':
      return <TbBrandCSharp size={size + 1} className="shrink-0 text-[#239120]" />;
    case 'c':
      return <SiC size={size} className="shrink-0 text-[#a8b9cc]" />;
    case 'vue':
      return <SiVuedotjs size={size} className="shrink-0 text-[#41b883]" />;
    case 'svelte':
      return <SiSvelte size={size} className="shrink-0 text-[#ff3e00]" />;
    case 'react':
    case 'jsx':
    case 'tsx':
      return <SiReact size={size} className="shrink-0 text-[#61dafb]" />;
    case 'sass':
    case 'scss':
      return <SiSass size={size} className="shrink-0 text-[#cc6699]" />;
    case 'php':
      return <SiPhp size={size} className="shrink-0 text-[#777bb4]" />;
    case 'kotlin':
      return <SiKotlin size={size} className="shrink-0 text-[#7f52ff]" />;
    case 'swift':
      return <SiSwift size={size} className="shrink-0 text-[#f05138]" />;
    case 'dart':
      return <SiDart size={size} className="shrink-0 text-[#0175c2]" />;
    case 'dockerfile':
    case 'docker':
      return <SiDocker size={size} className="shrink-0 text-[#2496ed]" />;
    default:
      return null;
  }
};




const GRADS = [
  ['#6366f1','#8b5cf6'], ['#3b82f6','#06b6d4'], ['#10b981','#22d3ee'],
  ['#f59e0b','#ef4444'], ['#ec4899','#8b5cf6'], ['#14b8a6','#3b82f6'],
  ['#f97316','#eab308'], ['#84cc16','#22d3ee'],
];
const grad = (name: string) => GRADS[name.charCodeAt(0) % GRADS.length];

const spring = { type: 'spring', stiffness: 300, damping: 30 } as const;
const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
} as const;

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
  const { activeInviteRepoId, setActiveInviteRepoId, pinnedIds, togglePin } = useSelectionStore();
  
  const { getPendingTransfer, removePendingTransfer } = useTransferStore();
  const pendingTransfer = getPendingTransfer(repo.id);

  const isInviteOpen = activeInviteRepoId === repo.id;
  const toggleInvite = () => setActiveInviteRepoId(isInviteOpen ? null : repo.id);

  const [collabCount, setCollabCount] = useState<number | null>(null);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [languages, setLanguages] = useState<string[]>(repo.language ? [repo.language] : []);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [hasFetchedLanguages, setHasFetchedLanguages] = useState(false);
  const isPinned = pinnedIds.includes(repo.id);
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
    if (!isExpanded || hasFetchedLanguages) return;
    let alive = true;
    (async () => {
      setLoadingLanguages(true);
      try {
        const d = await fetchRepoLanguages(repo.owner.login, repo.name);
        if (alive) {
          setLanguages(Object.keys(d));
          setHasFetchedLanguages(true);
        }
      } catch { /* silent */ }
      finally { if (alive) setLoadingLanguages(false); }
    })();
    return () => { alive = false; };
  }, [isExpanded, repo.owner.login, repo.name, hasFetchedLanguages]);

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
      layout
      transition={{
        layout: springConfig,
        default: { delay: Math.min(index * 0.02, 0.25), duration: 0.25, type: 'spring', stiffness: 200, damping: 22 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        layout
        transition={springConfig}
        className={cn(
          "group/row rounded-xl border transition-all duration-300 backdrop-blur-md overflow-hidden",
          isSelected
            ? "border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : isPinned
              ? "border-amber-500/30 bg-zinc-950/90 shadow-md hover:border-amber-500/50 hover:shadow-2xl hover:-translate-y-0.5"
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

            {/* Name */}
            <div className="flex items-center gap-1.5 min-w-0">
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
              {pendingTransfer && (
                <div className="flex items-center gap-1.5 mr-1 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    <Clock size={11} className="animate-pulse" /> Pending Transfer to {pendingTransfer.newOwner}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePendingTransfer(repo.id);
                      toast.success('Pending transfer revoked locally', {
                        description: 'The repository is now back in its normal active state.'
                      });
                    }}
                    className="px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-[10px] font-bold text-red-400 uppercase tracking-wider hover:bg-red-500/20 active:bg-red-500/30 transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              )}
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

            {/* Watermelon Pin Button */}
            <motion.button
              layout
              onClick={(e) => {
                e.stopPropagation();
                togglePin(repo.id);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shrink-0 cursor-pointer",
                isPinned
                  ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] opacity-100"
                  : "bg-white/5 border border-white/10 text-neutral-400 hover:text-neutral-200 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
              )}
            >
              <Pin size={14} className={cn(isPinned && "fill-white")} />
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 shrink-0 transition-all duration-200"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 0 : 180 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="flex items-center justify-center w-4 h-4"
              >
                <ChevronUp size={16} className="block shrink-0" />
              </motion.div>
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

                {/* Languages */}
                {(() => {
                  const mappedLanguages = languages
                    .map(lang => ({ name: lang, icon: getLanguageIcon(lang, 18) }))
                    .filter((item): item is { name: string; icon: React.ReactNode } => item.icon !== null);

                  return mappedLanguages.length > 0 && (
                    <DataRow icon={<Code2 size={15} />} label="Languages">
                      <div className="flex items-center gap-2.5 justify-end select-none">
                        {loadingLanguages && languages.length === 1 && (
                          <Loader2 size={12} className="animate-spin text-neutral-500 mr-1" />
                        )}
                        {mappedLanguages.slice(0, 5).map((item) => (
                          <span
                            key={item.name}
                            title={item.name}
                            className="inline-flex items-center justify-center hover:scale-115 transition-transform duration-200 cursor-help shrink-0"
                          >
                            {item.icon}
                          </span>
                        ))}
                        {mappedLanguages.length > 5 && (
                          <span
                            title={mappedLanguages.slice(5).map(i => i.name).join(', ')}
                            className="text-[11px] font-bold text-neutral-400 font-mono select-none hover:text-neutral-200 transition-colors duration-200 cursor-help shrink-0"
                          >
                            +{mappedLanguages.length - 5}
                          </span>
                        )}
                      </div>
                    </DataRow>
                  );
                })()}

                {/* Stars */}
                <DataRow icon={<Star size={15} />} label="Stars">
                  <span className="text-sm font-semibold text-neutral-300 font-mono">
                    {repo.stargazers_count}
                  </span>
                </DataRow>

                {/* Pin Status */}
                <DataRow icon={<Pin size={15} />} label="Pin Status">
                  <motion.button
                    onClick={e => { e.stopPropagation(); togglePin(repo.id); }}
                    whileTap={{ scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 outline-none select-none transition-colors duration-200"
                    style={{ color: isPinned ? '#f59e0b' : '#d4d4d8' }}
                  >
                    <Pin size={14} className={cn(isPinned && "fill-amber-500")} />
                    <span className="text-sm font-semibold">
                      {isPinned ? 'Pinned to top' : 'Pin to top'}
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

                  <motion.button
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={e => { e.stopPropagation(); togglePin(repo.id); }}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer border",
                      isPinned
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/45"
                        : "border-white/10 text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/15"
                    )}
                  >
                    <Pin size={13} className={cn(isPinned && "fill-amber-400")} /> {isPinned ? 'Pinned' : 'Pin'}
                  </motion.button>

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
