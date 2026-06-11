import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GithubIcon } from '../components/ui/GithubIcon';
import { Button } from '../components/ui/Button';
import { loginWithGitHub } from '../lib/auth';
import {
  ShieldCheck,
  Zap,
  Layers,
  FolderDown,
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  Archive,
  Star,
  Search,
  X,
  Users2,
  Check,
} from 'lucide-react';
import {
  SiTypescript,
  SiPython,
  SiGo,
  SiDocker,
} from 'react-icons/si';
import { DotPattern } from '../components/ui/dot-pattern';
import { Backlight } from '../components/ui/backlight-card';

interface MockRepo {
  id: string;
  name: string;
  description: string;
  stars: number;
  private: boolean;
  archived: boolean;
  languages: { name: string; icon: React.ReactNode; color: string }[];
}

export const Login: React.FC = () => {
  // Live Interactive Mock States
  const [selectedRepos, setSelectedRepos] = useState<string[]>(['gitsweep-core', 'adamas-registry']);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public'>('all');
  const [expandedRepo, setExpandedRepo] = useState<string | null>('adamas-registry');
  const [collaborators, setCollaborators] = useState<string[]>(['AbhishekS04 (Owner)', 'collaborator-one']);
  const [newCollabName, setNewCollabName] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  const mockRepos: MockRepo[] = [
    {
      id: 'gitsweep-core',
      name: 'gitsweep-core',
      description: 'Repository orchestrator for bulk workspace cleansing.',
      stars: 142,
      private: false,
      archived: false,
      languages: [
        { name: 'TypeScript', icon: <SiTypescript size={13} />, color: 'text-[#3178c6]' },
        { name: 'Docker', icon: <SiDocker size={13} />, color: 'text-[#2496ed]' },
      ],
    },
    {
      id: 'adamas-registry',
      name: 'adamas-registry',
      description: 'Administrative tools and identity registry system.',
      stars: 8,
      private: true,
      archived: false,
      languages: [
        { name: 'Go', icon: <SiGo size={13} />, color: 'text-[#00add8]' },
      ],
    },
    {
      id: 'legacy-backend',
      name: 'legacy-backend',
      description: 'Deprecated backend services and schema prototypes.',
      stars: 0,
      private: false,
      archived: true,
      languages: [
        { name: 'Python', icon: <SiPython size={13} />, color: 'text-[#3776ab]' },
      ],
    },
  ];

  // Filter repos based on interactive state
  const filteredRepos = mockRepos.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' ? true : !repo.private;
    return matchesSearch && matchesFilter;
  });

  const toggleRepoSelection = (id: string) => {
    setSelectedRepos((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabName.trim()) return;
    setCollaborators((prev) => [...prev, newCollabName.trim()]);
    setNewCollabName('');
    setShowInviteInput(false);
  };

  const handleRemoveCollaborator = (name: string) => {
    setCollaborators((prev) => prev.filter((item) => item !== name));
  };

  return (
    <div
      className="relative flex flex-col items-center justify-start min-h-screen py-8 sm:py-16 px-4 overflow-hidden select-none"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Knowledge Graph (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "GitSweep",
            "url": "https://gitsweep.app",
            "description": "A premium GitHub repository manager. Bulk-manage, archive, rename, delete, and backup repositories from a single dashboard.",
            "author": {
              "@type": "Person",
              "name": "Abhishek Singh",
              "jobTitle": "Full Stack Developer",
              "url": "https://abhisheksingh.tech",
              "email": "abhishek23main@gmail.com",
              "sameAs": [
                "https://github.com/AbhishekS04",
                "https://www.linkedin.com/in/abhishek-singh-045312292",
                "https://x.com/_abhishek2304"
              ]
            }
          })
        }}
      />

      {/* Identity Verification (rel="me") */}
      <ul className="sr-only" aria-hidden="true">
        <li>
          <a href="https://github.com/AbhishekS04" rel="me">
            AbhishekS04 on GitHub
          </a>
        </li>
        <li>
          <a href="https://www.linkedin.com/in/abhishek-singh-045312292" rel="me">
            Abhishek Singh on LinkedIn
          </a>
        </li>
        <li>
          <a href="https://x.com/_abhishek2304" rel="me">
            Abhishek Singh on Twitter/X
          </a>
        </li>
      </ul>

      {/* === DOT PATTERN HERO BG === */}
      {/* Covers the full hero area and fades to black at the bottom so the next
          section (features grid) appears to emerge from beneath the dots.        */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={[
            'fill-white/[0.09]',
            '[mask-image:linear-gradient(to_bottom,white_0%,white_45%,transparent_85%)]',
          ].join(' ')}
        />
      </div>

      {/* --- HERO SECTION --- */}
      <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-8 relative z-10 mb-16 sm:mb-20">
        
        {/* Core Product Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold text-neutral-300 uppercase tracking-widest cursor-default"
        >
          <Sparkles size={12} className="animate-pulse text-white" /> Introducing GitSweep 1.0
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-4xl sm:text-7xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.08] font-sans"
        >
          Declutter your <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">GitHub workspace</span> in seconds
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Bulk-manage, archive, rename, delete, and backup repositories from a single high-performance dashboard. Built specifically for developers.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3.5 pt-4"
        >
          <Button
            onClick={loginWithGitHub}
            className="h-12 px-8 gap-3.5 rounded-full font-bold text-sm bg-transparent border border-white/20 text-white cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors duration-150 shadow-none"
          >
            <GithubIcon className="h-5 w-5" />
            Continue with GitHub
          </Button>
          <p className="text-[11px] font-mono text-neutral-500 select-none">
            Uses GitHub OAuth · No password required · Scopes: repo, delete_repo, user
          </p>
        </motion.div>

      </div>

      {/* --- MOCK DASHBOARD INTERACTIVE PREVIEW --- */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl relative z-10 mb-20 sm:mb-28 cursor-default"
      >
        {/* Backlight: neutral white depth glow behind the card */}
        <Backlight
          blur={70}
          color="rgba(255,255,255,0.07)"
          size="80%"
          className="w-full"
        >
          <div
            className="rounded-2xl border border-white/10 bg-zinc-950/90 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl overflow-hidden"
          >
          {/* Mock Window Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="text-[11px] font-mono text-neutral-400 font-medium tracking-wide">gitsweep.app/dashboard</div>
            <div className="w-12" />
          </div>

          {/* Mock App Content */}
          <div className="p-4 sm:p-6 bg-zinc-950/20 space-y-4 font-sans">
            {/* Filter controls mock */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="h-9 w-full sm:w-52 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-neutral-300 font-mono focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all duration-200 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setFilterType((prev) => (prev === 'all' ? 'public' : 'all'))}
                  className={`h-9 px-4 rounded-lg border border-white/10 text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    filterType === 'public'
                      ? 'bg-white/10 text-white border-white/25'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  Public
                </button>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 self-end sm:self-auto select-none">
                Showing {filteredRepos.length} of 47 repositories
              </div>
            </div>

            {/* Repository Cards mock list */}
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {filteredRepos.map((repo) => {
                  const isSelected = selectedRepos.includes(repo.id);
                  const isExpanded = expandedRepo === repo.id;

                  return (
                    <div
                      key={repo.id}
                      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? 'border-indigo-500/40 bg-indigo-950/10 shadow-[0_4px_20px_rgba(79,70,229,0.05)]'
                          : 'border-white/10 bg-zinc-900/40 hover:border-white/20'
                      }`}
                    >
                      {/* Card Header Row */}
                      <div
                        onClick={() => setExpandedRepo(isExpanded ? null : repo.id)}
                        className="p-4 flex flex-row items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRepoSelection(repo.id);
                            }}
                            className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white'
                                : 'border-white/20 hover:border-white/40 bg-white/5'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                          </div>

                          {/* Repo Initial Letter Icon */}
                          <div
                            className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm bg-gradient-to-br ${
                              repo.id === 'gitsweep-core'
                                ? 'from-indigo-500 to-purple-600'
                                : repo.id === 'adamas-registry'
                                ? 'from-teal-500 to-emerald-600'
                                : 'from-rose-500 to-orange-600'
                            }`}
                          >
                            {repo.name.substring(0, 1).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold font-mono text-white tracking-wide truncate">
                              {repo.name}
                            </h3>
                            <p className="text-xs text-neutral-500 truncate max-w-[200px] sm:max-w-[380px] mt-0.5">
                              {repo.description}
                            </p>
                          </div>
                        </div>

                        {/* Status elements & language tags */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-mono">
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <Star size={13} className={repo.stars > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-neutral-600'} />
                            <span>{repo.stars}</span>
                          </div>

                          {/* Visibility badge */}
                          {repo.archived ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-bold text-rose-400 uppercase tracking-wider select-none">
                              <Archive size={9} /> Archived
                            </span>
                          ) : repo.private ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider select-none">
                              <Lock size={9} /> Private
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider select-none">
                              <Unlock size={9} /> Public
                            </span>
                          )}

                          {/* Tech Icons */}
                          <div className="flex items-center gap-1.5">
                            {repo.languages.map((lang, idx) => (
                              <div key={idx} className={lang.color} title={lang.name}>
                                {lang.icon}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section (Collaborators) */}
                      {isExpanded && repo.id === 'adamas-registry' && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="border-t border-white/5 bg-black/20"
                        >
                          <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold uppercase tracking-widest font-mono text-neutral-400">
                                Collaborators ({collaborators.length})
                              </div>
                              {showInviteInput ? (
                                <button
                                  onClick={() => setShowInviteInput(false)}
                                  className="text-[10px] font-mono text-neutral-500 hover:text-white"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowInviteInput(true)}
                                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                                >
                                  + Invite Member
                                </button>
                              )}
                            </div>

                            {/* Invite Input form */}
                            {showInviteInput && (
                              <form onSubmit={handleAddCollaborator} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={newCollabName}
                                  onChange={(e) => setNewCollabName(e.target.value)}
                                  placeholder="GitHub Username"
                                  className="h-8 flex-grow max-w-[200px] rounded bg-white/5 border border-white/10 px-2 text-xs text-white outline-none focus:border-indigo-500/50"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  className="h-8 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                                >
                                  Add
                                </button>
                              </form>
                            )}

                            {/* Collaborators list */}
                            <div className="flex flex-col gap-2">
                              {collaborators.map((collab, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-mono text-neutral-400">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-[9px] font-bold text-white uppercase select-none">
                                      {collab.substring(0, 1)}
                                    </div>
                                    <span>{collab}</span>
                                  </div>
                                  {collab.includes('(Owner)') ? (
                                    <span className="text-[10px] text-neutral-600 font-semibold pr-1">Admin</span>
                                  ) : (
                                    <button
                                      onClick={() => handleRemoveCollaborator(collab)}
                                      className="text-[10px] text-rose-500 hover:underline cursor-pointer pr-1"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bulk Actions Control Mock */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 font-mono">
              <div className="text-xs text-neutral-400">
                {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected
              </div>
              <button
                onClick={loginWithGitHub}
                className="h-9 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-all duration-200"
              >
                Bulk Actions <ArrowRight size={12} />
              </button>
            </div>
          </div>
          </div>
        </Backlight>
      </motion.div>

      {/* --- FEATURES GRID --- */}
      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {/* Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/15 hover:bg-zinc-950/70 hover:shadow-lg hover:shadow-white/5 transition-all duration-300"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Layers size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">Bulk Operations</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Select multiple repositories and toggle visibility (public/private), archive, or purge them in one unified transaction.
            </p>
          </div>
        </motion.div>

        {/* Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/15 hover:bg-zinc-950/70 hover:shadow-lg hover:shadow-white/5 transition-all duration-300"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">Instant Search & Filter</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Query the workspace with instantly updated filters by visibility, fork status, stars, and language stacks.
            </p>
          </div>
        </motion.div>

        {/* Feature 3 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/15 hover:bg-zinc-950/70 hover:shadow-lg hover:shadow-white/5 transition-all duration-300"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Users2 size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">Collaborator Control</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Audit access tokens, manage active invitations, and batch-remove users from multiple repositories simultaneously.
            </p>
          </div>
        </motion.div>

        {/* Feature 4 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/15 hover:bg-zinc-950/70 hover:shadow-lg hover:shadow-white/5 transition-all duration-300"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <FolderDown size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">Vault Local Backups</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Package codebases securely into ZIP archives and retrieve them to your local environment with one click.
            </p>
          </div>
        </motion.div>
      </div>

      {/* --- TRUST & SECURITY BANNER --- */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl border border-white/5 bg-white/[0.01] rounded-2xl p-6 relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between"
      >
        <div className="flex items-center gap-3 flex-col sm:flex-row">
          <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white font-mono">Bank-Grade OAuth Security</h4>
            <p className="text-xs text-neutral-400 mt-0.5 font-sans">
              GitSweep never stores your credentials. Actions are authorized directly by GitHub API tokens.
            </p>
          </div>
        </div>
        <Button
          onClick={loginWithGitHub}
          className="h-10 px-5 text-xs font-semibold rounded-lg bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 shrink-0 cursor-pointer transition-all duration-200"
        >
          Get Started Now
        </Button>
      </motion.div>
    </div>
  );
};
