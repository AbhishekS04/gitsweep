import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectionStore } from '../../store/selectionStore';
import { useRepoStore } from '../../store/repoStore';
import { useAuthStore } from '../../store/authStore';
import {
  updateRepoVisibility, updateRepoArchived,
  downloadRepoZip, deleteRepo, leaveRepo,
} from '../../lib/github';
import {
  Download, Lock, Unlock, Archive, ArchiveRestore,
  Trash2, X, Send, LogOut, Share2,
} from 'lucide-react';
import { backupRepoToTelegram, type TelegramBackupResult } from '../../lib/telegram';
import { DeleteModal } from '../ui/DeleteModal';
import { LeaveModal } from '../ui/LeaveModal';
import { TransferModal } from '../ui/TransferModal';
import { transferRepo, type Repo } from '../../lib/github';
import { useBackupStore } from '../../store/backupStore';
import { toast } from 'sonner';
import { FluidTabs, type TabItem } from '../ui/fluid-tabs';

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
        toast.error(`Failed: ${repo.name}`, { description: (e as any).message });
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

  const handleMakePrivate  = () => handleBulkAction('action', (o,r) => updateRepoVisibility(o,r,true),  id => updateRepoLocally(id, { private: true }));
  const handleMakePublic   = () => handleBulkAction('action', (o,r) => updateRepoVisibility(o,r,false), id => updateRepoLocally(id, { private: false }));
  const handleArchive      = () => handleBulkAction('action', (o,r) => updateRepoArchived(o,r,true),    id => updateRepoLocally(id, { archived: true }));
  const handleUnarchive    = () => handleBulkAction('action', (o,r) => updateRepoArchived(o,r,false),   id => updateRepoLocally(id, { archived: false }));
  const handleDownloadZip  = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedRepos.length, step: 'backup' });
    
    let successCount = 0;
    for (let i = 0; i < selectedRepos.length; i++) {
      const repo = selectedRepos[i];
      setProgress({ current: i + 1, total: selectedRepos.length, step: 'backup', repoName: repo.name });
      
      // 1. Trigger Browser Download
      try {
        await downloadRepoZip(repo.owner.login, repo.name, repo.default_branch);
      } catch (e) {
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
      } catch (e) {
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

  const progressBg = progress?.step === 'backup' ? '#3b82f6' : progress?.step === 'delete' ? '#e13535' : 'rgba(255,255,255,0.5)';
  const progressLabel = progress?.step === 'backup' ? 'Backing up' : progress?.step === 'delete' ? 'Deleting' : 'Processing';

  const allPrivate = selectedRepos.length > 0 && selectedRepos.every(r => r.private);
  const visibilityLabel = allPrivate ? 'Private' : 'Public';

  const allArchived = selectedRepos.length > 0 && selectedRepos.every(r => r.archived);
  const archiveLabel = allArchived ? 'Archived' : 'Active';

  const hasNonOwnedSelected = selectedRepos.some(r => r.owner.login !== user?.login);
  const hasOwnedSelected = selectedRepos.some(r => r.owner.login === user?.login);
  const deletableCount = selectedRepos.filter(r => r.owner.login === user?.login).length;

  /* shared pill style — matches the floating nav */
  const pillStyle: React.CSSProperties = {
    background: 'rgba(10,10,10,0.82)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '9999px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
  };

  const divStyle: React.CSSProperties = {
    width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', flexShrink: 0,
  };

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
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 72,  opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: 0,
              right: 0,
              zIndex: 50,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto', maxWidth: 'calc(100vw - 32px)' }}>
            <div style={{ ...pillStyle, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                ::-webkit-scrollbar { display: none; }
              `}</style>

              {/* Count badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '9999px', fontSize: '11px',
                  fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
                  whiteSpace: 'nowrap',
                }}>
                  {count} <span className="hidden sm:inline">selected</span>
                </span>
                {hasNonOwnedSelected && (
                  <span style={{ fontSize: '9px', color: '#eab308', paddingLeft: '8px', marginTop: '-2px' }}>
                    {deletableCount === 0 ? 'Cannot delete contributions' : 'Contributions filtered from delete'}
                  </span>
                )}
              </div>

              <div style={divStyle} />

              {/* Progress or action buttons */}
              {progress ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '220px', padding: '2px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>
                    <span>
                      {progressLabel}
                      {progress.repoName && <span style={{ color: 'rgba(255,255,255,0.7)' }}> · {progress.repoName}</span>}
                    </span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', background: progressBg, borderRadius: '99px' }}
                      animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <FluidTabs
                    tabs={actionTabs}
                    activeId={activeActionId}
                    onChange={handleActionChange}
                    hideLabelOnMobile
                    className="bg-transparent border-none p-0 gap-0 sm:gap-1 shadow-none"
                  />
                </div>
              )}

              <div style={divStyle} />

              {/* Delete */}
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={isProcessing || deletableCount === 0}
                title={deletableCount === 0 ? "Cannot delete contribution repositories" : "Delete selected"}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '9999px',
                  background: deletableCount === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(225,53,53,0.12)', 
                  border: deletableCount === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(225,53,53,0.2)',
                  color: deletableCount === 0 ? 'rgba(255,255,255,0.2)' : '#e13535', 
                  fontSize: '12px', fontWeight: 600,
                  cursor: deletableCount === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (deletableCount > 0) e.currentTarget.style.background = 'rgba(225,53,53,0.22)'; }}
                onMouseLeave={e => { if (deletableCount > 0) e.currentTarget.style.background = 'rgba(225,53,53,0.12)'; }}
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '0 12px', height: '36px', borderRadius: '10px',
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
                    color: '#a78bfa', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline" style={{ fontSize: '11px' }}>Share</span>
                </button>
              )}

              {/* Leave */}
              {hasNonOwnedSelected && (
                <button
                  onClick={() => setLeaveModalOpen(true)}
                  disabled={isProcessing}
                  title="Leave selected contribution repositories"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: '9999px',
                    background: 'rgba(59,130,246,0.12)', 
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#3b82f6', 
                    fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.22)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
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
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '9999px',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
              >
                <X size={13} />
              </button>
              
              <div style={{ width: '4px', flexShrink: 0 }} />
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 61, width: '100%', maxWidth: '360px', padding: '0 16px' }}
            >
              <div style={{ background: 'rgba(12,12,12,0.97)', backdropFilter: 'blur(40px)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '8px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '12px', flexShrink: 0 }}>
                    <Send size={14} style={{ color: '#eab308' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>Telegram Backup Failed</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                      Could not back up <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.7)' }}>{backupWarning.repo.name}</code>
                    </p>
                    <p style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', marginTop: '8px', padding: '6px 8px', background: 'rgba(225,53,53,0.08)', border: '1px solid rgba(225,53,53,0.15)', borderRadius: '8px', color: '#e13535', wordBreak: 'break-all' }}>
                      {backupWarning.error}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => skipBackupForCurrent?.(true)} style={{ height: '40px', background: '#e13535', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                    Delete anyway (no backup)
                  </button>
                  <button onClick={() => skipBackupForCurrent?.(false)} style={{ height: '40px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
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
    </>
  );
};
