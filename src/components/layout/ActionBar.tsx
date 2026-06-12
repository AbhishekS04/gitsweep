import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectionStore } from '../../store/selectionStore';
import { useRepoStore } from '../../store/repoStore';
import { useAuthStore } from '../../store/authStore';
import {
  updateRepoVisibility, updateRepoArchived,
  downloadRepoZip, deleteRepo, leaveRepo, renameRepo,
} from '../../lib/github';
import {
  Download, Lock, Unlock, Archive, ArchiveRestore,
  Trash2, X, Send, LogOut, Share2, Edit2,
} from 'lucide-react';
import { backupRepoToTelegram, type TelegramBackupResult } from '../../lib/telegram';
import { DeleteModal } from '../ui/DeleteModal';
import { LeaveModal } from '../ui/LeaveModal';
import { TransferModal } from '../ui/TransferModal';
import { RenameModal } from '../ui/RenameModal';
import { transferRepo, type Repo } from '../../lib/github';
import { useBackupStore } from '../../store/backupStore';
import { toast } from 'sonner';
import { FluidTabs, type TabItem } from '../ui/fluid-tabs';
import { cn } from '../../lib/utils';

type ProgressStep = 'backup' | 'delete' | 'action';
interface Progress { current: number; total: number; step: ProgressStep; repoName?: string; }
type BackupWarning = { repo: Repo; error: string };

export const ActionBar: React.FC = () => {
  const { selectedIds, deselectAll } = useSelectionStore();
  const { repos, updateRepoLocally, removeReposLocally } = useRepoStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [backupWarning, setBackupWarning] = useState<BackupWarning | null>(null);
  const [skipBackupForCurrent, setSkipBackupForCurrent] = useState<((v: boolean) => void) | null>(null);
  const { addLog, logs } = useBackupStore();
  const [activeActionId, setActiveActionId] = useState<string>('visibility');

  const selectedRepos = repos.filter(r => selectedIds.has(r.id));
  const count = selectedIds.size;

  const handleBulkAction = async (
    step: ProgressStep,
    fn: (owner: string, repo: string) => Promise<void>,
    localFn?: (id: number) => void,
  ) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: count, step });
    let successCount = 0;
    for (let i = 0; i < selectedRepos.length; i++) {
      const repo = selectedRepos[i];
      try {
        await fn(repo.owner.login, repo.name);
        if (localFn) localFn(repo.id);
        successCount++;
      }
      catch (e) {
        toast.error(`Failed: ${repo.name}`, { description: (e as Error).message });
      }
      setProgress({ current: i + 1, total: count, step, repoName: repo.name });
    }
    if (successCount > 0) {
      toast.success(`Updated ${successCount} repositories`);
    }
    setIsProcessing(false);
    setProgress(null);
    deselectAll();
  };

  const handleMakePrivate = () => handleBulkAction('action', (o, r) => updateRepoVisibility(o, r, true), id => updateRepoLocally(id, { private: true }));
  const handleMakePublic = () => handleBulkAction('action', (o, r) => updateRepoVisibility(o, r, false), id => updateRepoLocally(id, { private: false }));
  const handleArchive = () => handleBulkAction('action', (o, r) => updateRepoArchived(o, r, true), id => updateRepoLocally(id, { archived: true }));
  const handleUnarchive = () => handleBulkAction('action', (o, r) => updateRepoArchived(o, r, false), id => updateRepoLocally(id, { archived: false }));
  const handleDownloadZip = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedRepos.length, step: 'backup' });

    let successCount = 0;
    for (let i = 0; i < selectedRepos.length; i++) {
      const repo = selectedRepos[i];
      setProgress({ current: i + 1, total: selectedRepos.length, step: 'backup', repoName: repo.name });

      // 1. Trigger Browser Download
      try {
        await downloadRepoZip(repo.owner.login, repo.name, repo.default_branch);
      } catch {
        toast.error(`Local download failed: ${repo.name}`);
      }

      const existing = logs.find(l =>
        (l.repoFullName.toLowerCase() === repo.full_name.toLowerCase() ||
          (l.repoName.toLowerCase() === repo.name.toLowerCase() && l.owner.toLowerCase() === repo.owner.login.toLowerCase()))
        && l.fileId
      );

      if (existing) {
        toast.warning('Already Backed Up', { description: `${repo.name} already has a backup in Telegram.` });
        successCount++;
        continue;
      }

      try {
        const result = await backupRepoToTelegram(repo.owner.login, repo.name, {
          fullName: repo.full_name,
          description: repo.description,
          isPrivate: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
        }, 'backup');
        if (result.ok) {
          successCount++;
          addLog({
            repoName: repo.name, repoFullName: repo.full_name, owner: repo.owner.login,
            action: 'manual', status: 'success',
            fileId: result.fileId
          });
        } else {
          toast.error(`Telegram backup failed: ${repo.name}`, { description: result.error });
        }
      } catch {
        toast.error(`Backup error: ${repo.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Backed up ${successCount} repositories to Telegram`);
    }
    setIsProcessing(false);
    setProgress(null);
    deselectAll();
  };

  const handleDelete = async (shouldBackup: boolean) => {
    setDeleteModalOpen(false);
    setIsProcessing(true);

    // Only allow deleting repos where the user is the owner
    const deletableRepos = selectedRepos.filter(r => r.owner.login === user?.login);
    const idsToRemove: number[] = [];

    let lastBackupResult: TelegramBackupResult | null = null;

    for (let i = 0; i < deletableRepos.length; i++) {
      const repo = deletableRepos[i];
      if (shouldBackup) {
        const existing = logs.find(l =>
          (l.repoFullName.toLowerCase() === repo.full_name.toLowerCase() ||
            (l.repoName.toLowerCase() === repo.name.toLowerCase() && l.owner.toLowerCase() === repo.owner.login.toLowerCase()))
          && l.fileId
        );
        if (existing) {
          lastBackupResult = { ok: true, fileId: existing.fileId };
          toast.warning('Already Backed Up', { description: `Using existing backup for ${repo.name}` });
        } else {
          setProgress({ current: i + 1, total: deletableRepos.length, step: 'backup', repoName: repo.name });
          const result = await backupRepoToTelegram(repo.owner.login, repo.name, {
            fullName: repo.full_name, description: repo.description,
            isPrivate: repo.private, language: repo.language, stars: repo.stargazers_count,
          }, 'delete');

          lastBackupResult = result;

          if (!result.ok) {
            const go = await new Promise<boolean>(resolve => {
              setBackupWarning({ repo, error: result.error || 'Unknown error' });
              setSkipBackupForCurrent(() => resolve);
            });
            setBackupWarning(null); setSkipBackupForCurrent(null);
            if (!go) continue;
          }
        }
      }
      setProgress({ current: i + 1, total: deletableRepos.length, step: 'delete', repoName: repo.name });
      try {
        await deleteRepo(repo.owner.login, repo.name);
        idsToRemove.push(repo.id);
        addLog({
          repoName: repo.name, repoFullName: repo.full_name, owner: repo.owner.login,
          action: 'delete', status: 'success',
          fileId: lastBackupResult?.fileId
        });
      }
      catch (e) { console.error(e); }
    }
    if (idsToRemove.length > 0) {
      toast.success(`Deleted ${idsToRemove.length} repositories`);
    }
    removeReposLocally(idsToRemove);
    setIsProcessing(false);
    setProgress(null);
    deselectAll();
  };

  const handleLeave = async (shouldBackup: boolean) => {
    if (!user) return;
    setLeaveModalOpen(false);
    setIsProcessing(true);

    // Only target repos the user doesn't own
    const leavableRepos = selectedRepos.filter(r => r.owner.login !== user.login);
    const idsToRemove: number[] = [];

    let lastBackupResult: TelegramBackupResult | null = null;

    for (let i = 0; i < leavableRepos.length; i++) {
      const repo = leavableRepos[i];

      if (shouldBackup) {
        const existing = logs.find(l =>
          (l.repoFullName.toLowerCase() === repo.full_name.toLowerCase() ||
            (l.repoName.toLowerCase() === repo.name.toLowerCase() && l.owner.toLowerCase() === repo.owner.login.toLowerCase()))
          && l.fileId
        );
        if (existing) {
          lastBackupResult = { ok: true, fileId: existing.fileId };
          toast.warning('Already Backed Up', { description: `Using existing backup for ${repo.name}` });
        } else {
          setProgress({ current: i + 1, total: leavableRepos.length, step: 'backup', repoName: repo.name });
          const result = await backupRepoToTelegram(repo.owner.login, repo.name, {
            fullName: repo.full_name, description: repo.description,
            isPrivate: repo.private, language: repo.language, stars: repo.stargazers_count,
          }, 'leave');

          lastBackupResult = result;

          if (!result.ok) {
            const go = await new Promise<boolean>(resolve => {
              setBackupWarning({ repo, error: result.error || 'Unknown error' });
              setSkipBackupForCurrent(() => resolve);
            });
            setBackupWarning(null); setSkipBackupForCurrent(null);
            if (!go) continue;
          }
        }
      }

      setProgress({ current: i + 1, total: leavableRepos.length, step: 'action', repoName: repo.name });
      try {
        await leaveRepo(repo.owner.login, repo.name, user.login);
        idsToRemove.push(repo.id);
        addLog({
          repoName: repo.name, repoFullName: repo.full_name, owner: repo.owner.login,
          action: 'leave', status: 'success',
          fileId: lastBackupResult?.fileId
        });
      }
      catch (e) { console.error(e); }
    }

    if (idsToRemove.length > 0) {
      toast.success(`Left ${idsToRemove.length} repositories`);
    }
    removeReposLocally(idsToRemove);
    setIsProcessing(false);
    setProgress(null);
    deselectAll();
  };

  const handleTransfer = async (newOwner: string, shouldBackup: boolean) => {
    if (!user) return;
    setTransferModalOpen(false);
    setIsProcessing(true);

    // Only target repos the user owns
    const ownRepos = selectedRepos.filter(r => r.owner.login === user.login);
    const idsToRemove: number[] = [];

    let lastBackupResult: TelegramBackupResult | null = null;

    for (let i = 0; i < ownRepos.length; i++) {
      const repo = ownRepos[i];

      if (shouldBackup) {
        const existing = logs.find(l =>
          (l.repoFullName.toLowerCase() === repo.full_name.toLowerCase() ||
            (l.repoName.toLowerCase() === repo.name.toLowerCase() && l.owner.toLowerCase() === repo.owner.login.toLowerCase()))
          && l.fileId
        );
        if (existing) {
          lastBackupResult = { ok: true, fileId: existing.fileId };
          toast.warning('Already Backed Up', { description: `Using existing backup for ${repo.name}` });
        } else {
          setProgress({ current: i + 1, total: ownRepos.length, step: 'backup', repoName: repo.name });
          const result = await backupRepoToTelegram(repo.owner.login, repo.name, {
            fullName: repo.full_name, description: repo.description,
            isPrivate: repo.private, language: repo.language, stars: repo.stargazers_count,
          }, 'transfer');

          lastBackupResult = result;

          if (!result.ok) {
            const go = await new Promise<boolean>(resolve => {
              setBackupWarning({ repo, error: result.error || 'Unknown error' });
              setSkipBackupForCurrent(() => resolve);
            });
            setBackupWarning(null); setSkipBackupForCurrent(null);
            if (!go) continue;
          }
        }
      }

      setProgress({ current: i + 1, total: ownRepos.length, step: 'action', repoName: repo.name });
      try {
        await transferRepo(repo.owner.login, repo.name, newOwner);
        idsToRemove.push(repo.id);
        addLog({
          repoName: repo.name, repoFullName: repo.full_name, owner: repo.owner.login,
          action: 'transfer', status: 'success',
          fileId: lastBackupResult?.fileId
        });
      }
      catch (e) { console.error(e); }
    }

    if (idsToRemove.length > 0) {
      toast.success(`Shared ${idsToRemove.length} repositories with ${newOwner}`);
    }
    removeReposLocally(idsToRemove);
    setIsProcessing(false);
    setProgress(null);
    deselectAll();
  };

  const handleRename = async (newName: string) => {
    if (selectedRepos.length !== 1) return;
    const repo = selectedRepos[0];
    try {
      await renameRepo(repo.owner.login, repo.name, newName);
      updateRepoLocally(repo.id, {
        name: newName,
        full_name: `${repo.owner.login}/${newName}`,
      });
      toast.success(`Repository renamed to ${newName}`);
      deselectAll();
    } catch (err) {
      const error = err as Error;
      toast.error('Rename failed', { description: error.message || 'Check your permissions.' });
      throw error;
    }
  };

  const progressBg = progress?.step === 'backup' ? '#3b82f6' : progress?.step === 'delete' ? '#e13535' : 'rgba(255,255,255,0.5)';
  const progressLabel = progress?.step === 'backup' ? 'Backing up' : progress?.step === 'delete' ? 'Deleting' : 'Processing';

  const allPrivate = selectedRepos.length > 0 && selectedRepos.every(r => r.private);
  const visibilityLabel = allPrivate ? 'Private' : 'Public';

  const allArchived = selectedRepos.length > 0 && selectedRepos.every(r => r.archived);
  const archiveLabel = allArchived ? 'Archived' : 'Active';

  const hasNonOwnedSelected = selectedRepos.some(r => r.owner.login !== user?.login);
  const hasOwnedSelected = selectedRepos.some(r => r.owner.login === user?.login);
  const deletableCount = selectedRepos.filter(r => r.owner.login === user?.login).length;

  const actionTabs: TabItem[] = [
    {
      id: 'visibility',
      label: visibilityLabel,
      icon: (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={allPrivate ? 'lock' : 'unlock'}
            initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center shrink-0"
          >
            {allPrivate ? <Lock size={14} /> : <Unlock size={14} />}
          </motion.div>
        </AnimatePresence>
      )
    },
    {
      id: 'archive',
      label: archiveLabel,
      icon: (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={allArchived ? 'archived' : 'active'}
            initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center shrink-0"
          >
            {allArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </motion.div>
        </AnimatePresence>
      )
    },
    {
      id: 'zip',
      label: 'ZIP',
      icon: <Download size={14} />
    },
  ];

  const handleActionChange = (id: string) => {
    setActiveActionId(id);
    if (id === 'visibility') {
      if (allPrivate) handleMakePublic();
      else handleMakePrivate();
    } else if (id === 'archive') {
      if (allArchived) handleUnarchive();
      else handleArchive();
    } else if (id === 'zip') {
      handleDownloadZip();
    }
  };

  return (
    <>
      {/* ─── Bottom-center dock pill ─────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[calc(100vw-32px)]">
              <div className="flex items-center gap-2 px-4 py-2 bg-neutral-950/85 border border-white/10 rounded-full shadow-2xl backdrop-blur-2xl overflow-x-auto scrollbar-none">
                {/* Count badge */}
                <div className="flex flex-col items-start select-none shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-white/5 text-neutral-300 whitespace-nowrap">
                    {count} <span className="hidden sm:inline">selected</span>
                  </span>
                  {hasNonOwnedSelected && (
                    <span className="text-[9px] text-amber-500 pl-2 -mt-0.5 whitespace-nowrap">
                      {deletableCount === 0 ? 'Cannot delete contributions' : 'Contributions filtered'}
                    </span>
                  )}
                </div>

                <div className="w-[1px] h-4 bg-white/10 shrink-0" />

                {/* Progress or action buttons */}
                {progress ? (
                  <div className="flex flex-col gap-1 w-[220px] px-2 py-0.5 shrink-0">
                    <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                      <span className="truncate max-w-[150px]">
                        {progressLabel}
                        {progress.repoName && <span className="text-neutral-300"> · {progress.repoName}</span>}
                      </span>
                      <span className="shrink-0">{progress.current}/{progress.total}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: progressBg }}
                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <FluidTabs
                      tabs={actionTabs}
                      activeId={activeActionId}
                      onChange={handleActionChange}
                      hideLabelOnMobile
                      className="bg-transparent border-none p-0 gap-0 sm:gap-1 shadow-none"
                    />
                  </div>
                )}

                <div className="w-[1px] h-4 bg-white/10 shrink-0" />

                {/* Delete */}
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isProcessing || deletableCount === 0}
                  title={deletableCount === 0 ? "Cannot delete contribution repositories" : "Delete selected"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 select-none shrink-0",
                    deletableCount === 0
                      ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                      : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/30"
                  )}
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                {/* Transfer */}
                {hasOwnedSelected && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    disabled={isProcessing}
                    title="Share/Transfer selected repositories"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 select-none bg-purple-500/15 border border-purple-500/25 text-purple-400 hover:bg-purple-500/25 hover:border-purple-500/35 shrink-0"
                  >
                    <Share2 size={14} />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                )}

                {/* Rename */}
                {count === 1 && hasOwnedSelected && (
                  <button
                    onClick={() => setRenameModalOpen(true)}
                    disabled={isProcessing}
                    title="Rename repository"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 select-none bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/25 hover:border-indigo-500/35 shrink-0"
                  >
                    <Edit2 size={14} />
                    <span className="hidden sm:inline">Rename</span>
                  </button>
                )}

                {/* Leave */}
                {hasNonOwnedSelected && (
                  <button
                    onClick={() => setLeaveModalOpen(true)}
                    disabled={isProcessing}
                    title="Leave selected contribution repositories"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 select-none bg-blue-500/12 border border-blue-500/20 text-blue-500 hover:bg-blue-500/22 hover:border-blue-500/30 shrink-0"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                )}

                {/* Dismiss */}
                <button
                  onClick={deselectAll}
                  disabled={isProcessing}
                  title="Clear selection"
                  className="flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5 cursor-pointer transition-all duration-150 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Backup Failed Modal ──────────────────────────────── */}
      <AnimatePresence>
        {backupWarning && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-full max-w-sm px-4"
            >
              <div className="bg-zinc-950/95 border border-yellow-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-xl">
                <div className="flex gap-3 items-start text-left">
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl shrink-0">
                    <Send size={14} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Telegram Backup Failed</p>
                    <p className="text-xs text-neutral-400">
                      Could not back up <code className="font-mono text-neutral-300">{backupWarning.repo.name}</code>
                    </p>
                    <p className="text-xs font-mono mt-2 px-2 py-1.5 bg-red-500/5 border border-red-500/15 rounded-lg text-red-500 break-all">
                      {backupWarning.error}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => skipBackupForCurrent?.(true)}
                    className="h-10 w-full bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Delete anyway (no backup)
                  </button>
                  <button
                    onClick={() => skipBackupForCurrent?.(false)}
                    className="h-10 w-full bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Skip this repo (keep on GitHub)
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Delete Modal ────────────────────────────────────── */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        repoCount={count}
        singleRepoName={count === 1 ? selectedRepos[0]?.name : undefined}
        isDeleting={isProcessing}
      />

      {/* ─── Leave Modal ─────────────────────────────────────── */}
      <LeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleLeave}
        repoCount={selectedRepos.filter(r => r.owner.login !== user?.login).length}
        isProcessing={isProcessing}
      />

      {/* ─── Transfer Modal ──────────────────────────────────── */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onConfirm={handleTransfer}
        repoCount={selectedRepos.filter(r => r.owner.login === user?.login).length}
        isProcessing={isProcessing}
      />

      {/* ─── Rename Modal ────────────────────────────────────── */}
      {count === 1 && selectedRepos[0] && (
        <RenameModal
          isOpen={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          onConfirm={handleRename}
          currentName={selectedRepos[0].name}
        />
      )}
    </>
  );
};
