import React from 'react';
import { motion } from 'framer-motion';
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
  Users2,
  Lock,
  Unlock,
  Archive,
  Star,
} from 'lucide-react';
import {
  SiTypescript,
  SiJavascript,
  SiPython,
  SiGo,
  SiRust,
  SiDocker,
} from 'react-icons/si';

export const Login: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-start min-h-[90vh] py-12 px-4 overflow-hidden">
      {/* Dynamic Backlight glowing aura effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* --- HERO SECTION --- */}
      <div className="w-full max-w-4xl text-center space-y-6 relative z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 uppercase tracking-widest select-none"
        >
          <Sparkles size={12} className="animate-pulse" /> Introducing GitSweep 1.0
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.1]"
        >
          Declutter your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">GitHub workspace</span> in seconds
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Bulk-manage, archive, rename, delete, and invite collaborators to your repositories from a single high-performance dashboard. Zero friction, total control.
        </motion.p>

        {/* CTA Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3 pt-4"
        >
          <Button
            onClick={loginWithGitHub}
            className="h-12 px-8 gap-3 rounded-full font-bold text-sm bg-white hover:bg-neutral-200 text-neutral-950 border-none shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <GithubIcon className="h-5 w-5" />
            Continue with GitHub
          </Button>
          <p className="text-[11px] font-mono text-neutral-500 select-none">
            Uses GitHub OAuth · No password required · Scopes: repo, delete_repo, user
          </p>
        </motion.div>

        {/* Tech Stack Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-center gap-6 pt-8 text-neutral-600 select-none"
        >
          <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-widest">Supports</span>
          <div className="flex items-center gap-4">
            <SiTypescript size={18} title="TypeScript" className="hover:text-[#3178c6] transition-colors" />
            <SiJavascript size={18} title="JavaScript" className="hover:text-[#f7df1e] transition-colors" />
            <SiPython size={18} title="Python" className="hover:text-[#3776ab] transition-colors" />
            <SiGo size={18} title="Go" className="hover:text-[#00add8] transition-colors" />
            <SiRust size={18} title="Rust" className="hover:text-[#ea4a2b] transition-colors" />
            <SiDocker size={18} title="Docker" className="hover:text-[#2496ed] transition-colors" />
          </div>
        </motion.div>
      </div>

      {/* --- MOCK DASHBOARD PREVIEW --- */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl relative z-10 mb-24 select-none"
      >
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden">
          {/* Mock Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="text-xs font-mono text-neutral-500 font-semibold tracking-wide">gitsweep.app/dashboard</div>
            <div className="w-12" />
          </div>

          {/* Mock App Content */}
          <div className="p-6 bg-zinc-950/30 space-y-4">
            {/* Filter controls mock */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="h-9 w-48 rounded-lg border border-white/10 bg-white/5 px-3 flex items-center text-xs text-neutral-400 font-mono">
                  Search repositories...
                </div>
                <div className="h-9 w-24 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-xs text-neutral-300 font-mono font-medium">
                  Public
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-500">Showing 3 of 47 repositories</div>
            </div>

            {/* Repository Cards mock list */}
            <div className="space-y-3">
              {/* Card 1 */}
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-white/20 bg-white/5 flex items-center justify-center text-neutral-400">✓</div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-mono font-bold text-white text-sm">G</div>
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-white">gitsweep-core</h3>
                    <p className="text-xs text-neutral-500">Repository orchestrator for bulk workspace cleansing.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono"><Star size={12} className="text-amber-500 fill-amber-500" /> 142</div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <Unlock size={10} /> Public
                  </span>
                  <div className="flex items-center gap-1">
                    <SiTypescript size={14} className="text-[#3178c6]" />
                    <SiDocker size={14} className="text-[#2496ed]" />
                  </div>
                </div>
              </div>

              {/* Card 2 (Expanded collaborator panel mock view) */}
              <div className="rounded-xl border border-indigo-500/40 bg-zinc-900/80 shadow-lg shadow-indigo-500/5 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/20 bg-white/5 flex items-center justify-center text-neutral-400">✓</div>
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center font-mono font-bold text-white text-sm">A</div>
                    <div>
                      <h3 className="text-sm font-semibold font-mono text-white">adamas-registry</h3>
                      <p className="text-xs text-neutral-500">Administrative tools and identity registry system.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono"><Star size={12} className="text-neutral-500" /> 8</div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      <Lock size={10} /> Private
                    </span>
                    <div className="flex items-center gap-1">
                      <SiGo size={14} className="text-[#00add8]" />
                    </div>
                  </div>
                </div>
                {/* Expanded collab pane */}
                <div className="px-5 py-4 bg-black/30 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400">Collaborators (3)</div>
                    <span className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer">+ Invite Member</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20" />
                        <span>AbhishekS04 (Owner)</span>
                      </div>
                      <span className="text-[10px] text-neutral-600">Admin</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-800" />
                        <span>collaborator-one</span>
                      </div>
                      <span className="text-[10px] text-rose-500 hover:underline cursor-pointer">Remove</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-white/20 bg-white/5 flex items-center justify-center text-neutral-400">✓</div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-mono font-bold text-white text-sm">L</div>
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-neutral-300">legacy-backend</h3>
                    <p className="text-xs text-neutral-600">Deprecated backend services and schema prototypes.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono"><Star size={12} className="text-neutral-600" /> 0</div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    <Archive size={10} /> Archived
                  </span>
                  <div className="flex items-center gap-1">
                    <SiPython size={14} className="text-[#3776ab]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions Control Mock */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="text-xs font-mono text-neutral-400">2 repositories selected</div>
              <div className="flex gap-2">
                <div className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20">
                  Bulk Actions <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- FEATURES GRID --- */}
      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {/* Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/10 hover:bg-zinc-950/60 transition-all duration-200"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Bulk Operations</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Select tens of repositories and update their visibility (public/private), archive/unarchive them, or delete them in one unified batch.
            </p>
          </div>
        </motion.div>

        {/* Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/10 hover:bg-zinc-950/60 transition-all duration-200"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Instant Search & Filter</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Find the target project instantly by parsing repositories against names, descriptions, or specific language tech stacks.
            </p>
          </div>
        </motion.div>

        {/* Feature 3 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/10 hover:bg-zinc-950/60 transition-all duration-200"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users2 size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Collaborator Management</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Add new collaborators, view all existing invites, or revoke repository permissions for users in bulk with ease.
            </p>
          </div>
        </motion.div>

        {/* Feature 4 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 flex gap-4 hover:border-white/10 hover:bg-zinc-950/60 transition-all duration-200"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <FolderDown size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Vault Local Backups</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Select crucial repositories and download them directly as ZIP archives into your local storage secure backup vault.
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
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Bank-Grade OAuth Security</h4>
            <p className="text-xs text-neutral-400">
              We never see, store, or transmit your password. Authentication is processed directly by GitHub.
            </p>
          </div>
        </div>
        <Button
          onClick={loginWithGitHub}
          className="h-10 px-5 text-xs font-semibold rounded-lg bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 shrink-0 cursor-pointer"
        >
          Get Started Now
        </Button>
      </motion.div>
    </div>
  );
};
