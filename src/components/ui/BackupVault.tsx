import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Search, X, Trash2, ExternalLink,
  Archive, LogOut, Share2, Shield, Calendar, Clock,
  Plus, RefreshCw, Loader2
} from 'lucide-react';
import { useBackupStore, type BackupLog } from '../../store/backupStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface BackupVaultProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupVault: React.FC<BackupVaultProps> = ({ isOpen, onClose }) => {
  const { logs, clearLogs, addLog, updateLog } = useBackupStore();
  const [search, setSearch] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualRepo, setManualRepo] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [tempFileId, setTempFileId] = useState('');
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleUpdateFileId = (id: string) => {
    if (!tempFileId) return;
    updateLog(id, { fileId: tempFileId });
    setLinkingId(null);
    setTempFileId('');
  };

  const handleRestore = async (log: BackupLog) => {
    if (!log.fileId) {
      toast.error('No backup file attached', { description: 'Try manual restore for this record.' });
      return;
    }

    toast.info(`Restoring ${log.repoName}...`, { description: 'Please wait while we rebuild the repository.' });

    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    setRestoringId(log.id);
    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: log.fileId,
          repoName: log.repoName,
          token,
          owner: user.login
        })
      });
      const data = await res.json() as { ok: boolean; message_id?: number; file_id?: string; url?: string; error?: string };
      if (data.ok) {
        toast.success('Repository resurrected!', {
          description: `Restored ${log.repoName} to GitHub successfully.`,
          action: { label: 'View', onClick: () => window.open(data.url, '_blank') }
        });
      } else {
        toast.error('Restore failed', { description: data.error });
      }
    } catch (e) {
      toast.error('Restore failed', { description: 'Check console for details.' });
    } finally {
      setRestoringId(null);
    }
  };

  const handleManualAdd = () => {
    if (!manualRepo.includes('/')) {
      toast.warning('Invalid format', { description: 'Please use owner/repo format.' });
      return;
    }

    const [owner, name] = manualRepo.split('/').map(s => s.trim());
    const exists = logs.some(l =>
      l.repoFullName.toLowerCase() === manualRepo.trim().toLowerCase() ||
      (l.repoName.toLowerCase() === name.toLowerCase() && l.owner.toLowerCase() === owner.toLowerCase())
    );

    if (exists) {
      toast.warning('Already in Vault', { description: `${owner}/${name} is already tracked in your history.` });
      return;
    }
    addLog({
      repoName: name,
      repoFullName: `${owner}/${name}`,
      owner,
      action: 'manual',
      status: 'success'
    });
    setManualRepo('');
    setShowManualAdd(false);
  };

  const filteredLogs = logs.filter(log =>
    log.repoName.toLowerCase().includes(search.toLowerCase()) ||
    log.owner.toLowerCase().includes(search.toLowerCase())
  );

  const getActionIcon = (action: BackupLog['action']) => {
    switch (action) {
      case 'delete': return <Trash2 size={14} color="#ef4444" />;
      case 'leave': return <LogOut size={14} color="#f59e0b" />;
      case 'transfer': return <Share2 size={14} color="#8b5cf6" />;
      default: return <Archive size={14} color="#3b82f6" />;
    }
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(12px)',
              zIndex: 1000,
            }}
          />

          {/* Vault Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: '500px',
              background: '#0a0a0a',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              zIndex: 1001,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
                }}>
                  <History size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>Backup Vault</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>History of Telegram backups</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', padding: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search & Actions */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <History size={14} />
                  Action History
                </div>
                <button
                  onClick={() => setShowManualAdd(!showManualAdd)}
                  title="Manually log an old delete"
                  style={{
                    padding: '10px', borderRadius: '10px',
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    color: '#3b82f6', cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <AnimatePresence>
                {showManualAdd && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px'
                    }}>
                      <input
                        type="text"
                        placeholder="owner/repository"
                        value={manualRepo}
                        onChange={(e) => setManualRepo(e.target.value)}
                        style={{
                          flex: 1, background: 'none', border: 'none', color: 'white',
                          fontSize: '13px', outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleManualAdd}
                        style={{
                          padding: '4px 12px', background: '#3b82f6', border: 'none',
                          borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {filteredLogs.length} Records Found
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={() => {
                      toast.warning('Are you sure?', {
                        description: 'This will clear all backup history.',
                        action: { label: 'Clear', onClick: () => clearLogs() }
                      });
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    Clear History
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable History List */}
            <div
              data-lenis-prevent
              style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', opacity: 0.3, textAlign: 'center'
                }}>
                  <Shield size={48} style={{ marginBottom: '16px' }} />
                  <p style={{ fontSize: '14px' }}>{search ? 'No matches found' : 'Your vault is empty'}</p>
                  <p style={{ fontSize: '12px' }}>{search ? 'Try another search term' : 'Successful backups will appear here'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredLogs.map((log) => (
                    <motion.div
                      layout
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '16px', borderRadius: '16px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{log.repoName}</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{log.owner}</span>
                        </div>
                        <div style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          {getActionIcon(log.action)}
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{log.action}</span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                          <Calendar size={12} />
                          {formatDate(log.timestamp)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                          <Clock size={12} />
                          {formatTime(log.timestamp)}
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!log.fileId && linkingId !== log.id && (
                            <button
                              onClick={() => setLinkingId(log.id)}
                              style={{
                                background: 'rgba(255,255,255,0.05)', border: 'none',
                                color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600,
                                padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >
                              Link ID
                            </button>
                          )}

                          {linkingId === log.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  placeholder="File ID"
                                  value={tempFileId}
                                  autoFocus
                                  onChange={(e) => setTempFileId(e.target.value)}
                                  style={{
                                    background: 'rgba(255,255,255,0.1)', border: 'none',
                                    color: 'white', fontSize: '10px', padding: '2px 6px',
                                    borderRadius: '4px', width: '80px', outline: 'none'
                                  }}
                                />
                                <button
                                  onClick={() => handleUpdateFileId(log.id)}
                                  style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setLinkingId(null)}
                                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                                >
                                  X
                                </button>
                              </div>
                              <button
                                disabled={isSyncing}
                                onClick={async () => {
                                  setIsSyncing(true);
                                  try {
                                    const res = await fetch('/api/telegram');
                                    const data = await res.json();
                                    if (data.ok) {
                                      const docs = data.documents || [];
                                      setRecentFiles(docs);

                                      // Auto-link logic: match filenames to repo names for missing fileIds
                                      let linkedCount = 0;
                                      docs.forEach((doc: any) => {
                                        logs.forEach(log => {
                                          if (!log.fileId && doc.fileName.toLowerCase().includes(log.repoName.toLowerCase())) {
                                            updateLog(log.id, { fileId: doc.fileId });
                                            linkedCount++;
                                          }
                                        });
                                      });

                                      if (linkedCount > 0) {
                                        toast.success(`Auto-linked ${linkedCount} backups`, {
                                          description: 'Restored missing File IDs from bot history.'
                                        });
                                      } else if (docs.length === 0) {
                                        toast.error('No files found', { description: 'Forward the ZIP to your bot first!' });
                                      }
                                    } else {
                                      toast.error('Sync failed', { description: data.error });
                                    }
                                  } catch (e) {
                                    toast.error('Sync failed');
                                  } finally {
                                    setIsSyncing(false);
                                  }
                                }}
                                style={{
                                  background: 'none', border: '1px solid rgba(59,130,246,0.3)',
                                  color: '#3b82f6', fontSize: '9px', padding: '4px 6px',
                                  borderRadius: '4px', cursor: 'pointer'
                                }}
                              >
                                {isSyncing ? 'Scanning Bot...' : '🔄 Scan Bot for Forwarded ZIPs'}
                              </button>

                              {recentFiles.length > 0 && (
                                <div style={{
                                  marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px',
                                  maxHeight: '100px', overflowY: 'auto', padding: '4px',
                                  background: 'rgba(255,255,255,0.05)', borderRadius: '4px'
                                }}>
                                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
                                    Found in bot:
                                  </div>
                                  {recentFiles.map((file, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setTempFileId(file.fileId)}
                                      style={{
                                        background: tempFileId === file.fileId ? 'rgba(59,130,246,0.2)' : 'none',
                                        border: 'none', color: 'white', fontSize: '9px', textAlign: 'left',
                                        padding: '2px 4px', borderRadius: '2px', cursor: 'pointer',
                                        display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis'
                                      }}
                                    >
                                      📎 {file.fileName}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {log.fileId && (
                            <button
                              onClick={() => handleRestore(log)}
                              disabled={restoringId === log.id}
                              style={{
                                background: 'rgba(59,130,246,0.1)', border: 'none',
                                color: '#3b82f6', fontSize: '11px', fontWeight: 600,
                                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              {restoringId === log.id ? (
                                <>
                                  <Loader2 size={10} className="animate-spin" />
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={10} />
                                  Resurrect
                                </>
                              )}
                            </button>
                          )}
                          <a
                            href={`https://t.me/share/url?url=https://github.com/${log.repoFullName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '11px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500
                            }}
                          >
                            TG
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Hint */}
            <div style={{
              padding: '16px 24px', background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                GitSweep Vault is stored locally on this device.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
