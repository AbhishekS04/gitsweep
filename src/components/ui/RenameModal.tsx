import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, AlertCircle } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
  currentName: string;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
}) => {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen, currentName]);

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleInputChange = (val: string) => {
    setNewName(val);
    setError(null);
  };

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Repository name cannot be empty');
      return;
    }
    if (trimmed === currentName) {
      setError('New name must be different from current name');
      return;
    }
    // GitHub repo name validation: only alphanumeric, hyphens, periods, or underscores
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      setError('Name can only contain letters, numbers, hyphens (-), underscores (_), and periods (.)');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename repository');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = newName.trim() && newName.trim() !== currentName && !error;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            style={{
              position: 'fixed',
              inset: 0,
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
                {/* Stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)' }} />

                <div style={{ padding: '24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                      <Edit2 size={18} style={{ color: '#a855f7' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '5px' }}>
                        Rename Repository
                      </h2>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                        Update the name of <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{currentName}</span> on GitHub. Remote repository paths will change.
                      </p>
                    </div>
                  </div>

                  {/* Input and Error section */}
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      autoFocus
                      value={newName}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Enter new repository name..."
                      disabled={isProcessing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isValid && !isProcessing) {
                          handleRename();
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${error ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                        color: 'white',
                        outline: 'none',
                        boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />

                    {error && (
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        marginTop: '8px',
                        color: '#f87171',
                        fontSize: '12px',
                      }}>
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleClose}
                      disabled={isProcessing}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleRename}
                      disabled={!isValid || isProcessing}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isValid && !isProcessing
                          ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                          : 'rgba(255,255,255,0.07)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: isValid && !isProcessing ? 'pointer' : 'not-allowed',
                        opacity: isValid && !isProcessing ? 1 : 0.4,
                        boxShadow: isValid && !isProcessing ? '0 4px 16px rgba(139,92,246,0.35)' : 'none',
                        transition: 'opacity 0.2s, background 0.2s',
                      }}
                    >
                      {isProcessing ? 'Renaming...' : 'Rename'}
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
