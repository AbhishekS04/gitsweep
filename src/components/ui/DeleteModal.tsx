import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Send, Copy, Check, Trash2 } from 'lucide-react';
import { isTelegramConfigured } from '../../lib/telegram';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shouldBackup: boolean) => void;
  repoCount: number;
  singleRepoName?: string;
  isDeleting: boolean;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px',
        fontSize: '11px', fontWeight: 500,
        cursor: 'pointer', transition: 'all 0.18s ease',
        background: copied ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
        color: copied ? '#60a5fa' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${copied ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {copied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen, onClose, onConfirm, repoCount, singleRepoName, isDeleting,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [understood, setUnderstood] = useState(false);
  const telegramReady = isTelegramConfigured();
  const [shouldBackup, setShouldBackup] = useState(telegramReady);

  const isBulk = repoCount > 1;
  const inputMatches = confirmText === singleRepoName;
  const canDelete = isBulk ? understood : inputMatches;

  const handleClose = () => {
    if (!isDeleting) { setConfirmText(''); setUnderstood(false); onClose(); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 51,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: '420px' }}>
            <div style={{
              background: 'rgba(13,13,13,0.98)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '20px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}>

              {/* Danger stripe at top */}
              <div style={{ height: '3px', background: 'linear-gradient(90deg, #e13535 0%, #f87171 100%)' }} />

              <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(225,53,53,0.1)', border: '1px solid rgba(225,53,53,0.2)',
                  }}>
                    <AlertTriangle size={18} style={{ color: '#e13535' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '5px', lineHeight: 1.2 }}>
                      Delete {isBulk ? `${repoCount} Repositories` : 'Repository'}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>
                      This is <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>permanent and cannot be undone</span>. All commits, branches, and issues will be erased from GitHub.
                    </p>
                  </div>
                </div>

                {/* Telegram Backup toggle */}
                <div
                  onClick={() => telegramReady && setShouldBackup(v => !v)}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '14px', borderRadius: '14px', marginBottom: '16px',
                    cursor: telegramReady ? 'pointer' : 'default',
                    opacity: telegramReady ? 1 : 0.45,
                    transition: 'background 0.18s, border-color 0.18s',
                    background: shouldBackup && telegramReady ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${shouldBackup && telegramReady ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s ease',
                    background: shouldBackup && telegramReady ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${shouldBackup && telegramReady ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
                  }}>
                    {shouldBackup && telegramReady && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <Send size={13} style={{ color: telegramReady ? '#3b82f6' : 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                        Backup to Telegram first
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                      {telegramReady
                        ? 'Repo will be zipped and sent to your Telegram chat before deletion.'
                        : 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local to enable.'}
                    </p>
                  </div>
                </div>

                {/* Confirmation */}
                {isBulk ? (
                  <div
                    onClick={() => setUnderstood(v => !v)}
                    style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '14px', borderRadius: '14px', marginBottom: '20px',
                      cursor: 'pointer',
                      background: understood ? 'rgba(225,53,53,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${understood ? 'rgba(225,53,53,0.22)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.18s',
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.18s ease',
                      background: understood ? '#e13535' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${understood ? '#e13535' : 'rgba(255,255,255,0.15)'}`,
                    }}>
                      {understood && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
                      I understand this will permanently delete{' '}
                      <span style={{ color: 'white', fontWeight: 600 }}>{repoCount} repositories</span>{' '}
                      and this action cannot be undone.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                      Type the repository name to confirm:
                    </p>
                    {/* Repo name display */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: '10px', marginBottom: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <code style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.65)' }}>
                        {singleRepoName}
                      </code>
                      <CopyButton text={singleRepoName || ''} />
                    </div>
                    {/* Input */}
                    <input
                      type="text"
                      aria-label="Repository name confirmation"
                      autoFocus
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder="Type repo name here..."
                      disabled={isDeleting}
                      style={{
                        width: '100%', height: '42px', padding: '0 12px',
                        fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${inputMatches && confirmText ? 'rgba(225,53,53,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px', color: 'white',
                        outline: 'none',
                        boxShadow: inputMatches && confirmText ? '0 0 0 3px rgba(225,53,53,0.1)' : 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isDeleting}
                    style={{
                      flex: 1, height: '42px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => onConfirm(shouldBackup)}
                    disabled={!canDelete || isDeleting}
                    style={{
                      flex: 1, height: '42px', borderRadius: '12px', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      fontSize: '14px', fontWeight: 600, cursor: canDelete ? 'pointer' : 'not-allowed',
                      transition: 'opacity 0.2s, background 0.2s',
                      opacity: !canDelete || isDeleting ? 0.4 : 1,
                      background: canDelete
                        ? (shouldBackup ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #b91c1c, #e13535)')
                        : 'rgba(255,255,255,0.07)',
                      color: 'white',
                      boxShadow: canDelete ? (shouldBackup ? '0 4px 16px rgba(59,130,246,0.35)' : '0 4px 16px rgba(225,53,53,0.35)') : 'none',
                    }}
                  >
                    {isDeleting ? (
                      <span style={{ opacity: 0.7 }}>Processing…</span>
                    ) : shouldBackup ? (
                      <><Send size={14} /> Backup & Delete</>
                    ) : (
                      <><Trash2 size={14} /> Delete Permanently</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
