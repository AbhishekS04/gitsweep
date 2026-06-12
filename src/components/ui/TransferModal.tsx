import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Send, Check, Search, Loader2, X } from 'lucide-react';
import { isTelegramConfigured } from '../../lib/telegram';
import { searchUsers } from '../../lib/github';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newOwner: string, shouldBackup: boolean) => void;
  repoCount: number;
  isProcessing: boolean;
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen, onClose, onConfirm, repoCount, isProcessing,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GitHubUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<GitHubUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const telegramReady = isTelegramConfigured();
  const [shouldBackup, setShouldBackup] = useState(telegramReady);

  const isBulk = repoCount > 1;

  useEffect(() => {
    if (query.length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(query);
        setResults(users as GitHubUser[]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleClose = () => {
    if (!isProcessing) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          />

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
            <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: '400px' }}>
              <div style={{
                background: 'rgba(13,13,13,0.98)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '20px',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}>
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)' }} />

                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                      <Share2 size={18} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '5px' }}>
                        Share {isBulk ? `${repoCount} Repositories` : 'Ownership'}
                      </h2>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                        Search for the new owner. They will receive an invitation in their Notifications.
                      </p>
                    </div>
                  </div>

                  {/* Selected User display */}
                  {selectedUser ? (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', 
                      padding: '12px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)', marginBottom: '20px'
                    }}>
                      <img src={selectedUser.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{selectedUser.login}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Target Recipient</p>
                      </div>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                        Search Recipient
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Type username..."
                          disabled={isProcessing}
                          style={{
                            width: '100%', height: '44px', padding: '0 12px 0 36px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {isSearching && (
                          <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        )}
                      </div>

                      {/* Search Results Dropdown */}
                      {results.length > 0 && (
                        <div 
                          data-lenis-prevent
                          style={{
                            position: 'absolute', top: '70px', left: 0, right: 0,
                            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', overflowY: 'auto', zIndex: 60,
                            maxHeight: '200px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          }}
                        >
                          {results.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setSelectedUser(user);
                                setQuery('');
                                setResults([]);
                              }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', background: 'none', border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                color: 'white', fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                              }}
                            >
                              <img src={user.avatar_url} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                              <span>{user.login}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    onClick={() => telegramReady && setShouldBackup(v => !v)}
                    style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '14px', borderRadius: '14px', marginBottom: '20px',
                      cursor: telegramReady ? 'pointer' : 'default',
                      opacity: telegramReady ? 1 : 0.45,
                      background: shouldBackup && telegramReady ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${shouldBackup && telegramReady ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                        Highly recommended before losing access.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleClose}
                      disabled={isProcessing}
                      style={{
                        flex: 1, height: '42px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => onConfirm(selectedUser!.login, shouldBackup)}
                      disabled={isProcessing || !selectedUser}
                      style={{
                        flex: 1, height: '42px', borderRadius: '12px', border: 'none',
                        background: selectedUser ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(255,255,255,0.07)',
                        color: 'white', fontSize: '14px', fontWeight: 600, cursor: selectedUser ? 'pointer' : 'not-allowed',
                        boxShadow: selectedUser ? '0 4px 16px rgba(139,92,246,0.35)' : 'none',
                        transition: 'opacity 0.2s',
                        opacity: selectedUser ? 1 : 0.5,
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Share Access'}
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
