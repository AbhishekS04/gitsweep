import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Send, X, ShieldAlert, HelpCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    telegramBotToken,
    telegramChatId,
    setTelegramCredentials,
    clearTelegramCredentials,
  } = useSettingsStore();

  const [botToken, setBotToken] = useState(telegramBotToken);
  const [chatId, setChatId] = useState(telegramChatId);
  const [isTesting, setIsTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBotToken(telegramBotToken);
      setChatId(telegramChatId);
    }
  }, [isOpen, telegramBotToken, telegramChatId]);

  const handleSave = () => {
    if (!botToken.trim() || !chatId.trim()) {
      clearTelegramCredentials();
      toast.success('Telegram configuration cleared');
      onClose();
      return;
    }
    setTelegramCredentials(botToken.trim(), chatId.trim());
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleTestConnection = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Missing credentials', { description: 'Please enter a Bot Token and Chat ID to test.' });
      return;
    }

    setIsTesting(true);
    try {
      const payload = {
        mode: 'test',
        chatId: chatId.trim(),
        botToken: botToken.trim()
      };

      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success('Connection successful!', { description: 'A test message has been sent to your Telegram chat.' });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      const error = err as Error;
      toast.error('Connection failed', { description: error.message || 'Verify your Telegram credentials.' });
    } finally {
      setIsTesting(false);
    }
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg">
              <div className="bg-zinc-950/98 border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.85)] overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Title & Close */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Settings size={18} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white font-mono">GitSweep Settings</h2>
                        <p className="text-xs text-neutral-500">Configure personal Telegram credentials</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close settings"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Settings Panel */}
                  <div className="space-y-4">
                    {/* Bot Token input */}
                    <div className="space-y-1.5">
                      <label htmlFor="telegram-bot-token" className="text-[10px] uppercase font-bold font-mono tracking-wider text-neutral-400">
                        Telegram Bot Token
                      </label>
                      <input
                        id="telegram-bot-token"
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="e.g. 1234567890:ABCdefGhI..."
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:border-blue-500/50 outline-none transition-all"
                      />
                    </div>

                    {/* Chat ID input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="telegram-chat-id" className="text-[10px] uppercase font-bold font-mono tracking-wider text-neutral-400">
                          Telegram Chat ID
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowInstructions(!showInstructions)}
                          className="text-[10px] font-mono text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle size={11} />
                          {showInstructions ? 'Hide setup steps' : 'How to get this?'}
                        </button>
                      </div>
                      <input
                        id="telegram-chat-id"
                        type="text"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="e.g. 987654321"
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white font-mono placeholder:text-neutral-600 focus:border-blue-500/50 outline-none transition-all"
                      />
                    </div>

                    {/* Setup instructions block */}
                    {showInstructions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-neutral-400 space-y-2 font-sans"
                      >
                        <p className="font-bold text-neutral-200">How to configure your Telegram Bot:</p>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                          <li>
                            Search for{' '}
                            <a
                              href="https://t.me/BotFather"
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline font-bold"
                            >
                              @BotFather
                            </a>{' '}
                            on Telegram.
                          </li>
                          <li>
                            Send <code className="bg-white/10 px-1 rounded font-mono">/newbot</code>, complete
                            the setup, and copy the **HTTP API Bot Token**.
                          </li>
                          <li>
                            Search for{' '}
                            <a
                              href="https://t.me/userinfobot"
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline font-bold"
                            >
                              @userinfobot
                            </a>{' '}
                            to get your account's numeric **Chat ID**.
                          </li>
                          <li>
                            **CRITICAL**: Open a chat with your new bot and send it{' '}
                            <code className="bg-white/10 px-1 rounded font-mono">/start</code> (otherwise the bot
                            cannot message you).
                          </li>
                        </ol>
                      </motion.div>
                    )}

                    {/* Security notice */}
                    <div className="flex gap-2 p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 text-[11px] text-yellow-500/80 leading-normal">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <p>
                        Your credentials are saved strictly inside your local browser's storage and never sent to third-party databases.
                      </p>
                    </div>

                    {/* Test connection button */}
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="w-full h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                    >
                      <Send size={12} className={isTesting ? 'animate-pulse' : ''} />
                      {isTesting ? 'Testing Telegram Connection...' : 'Test Telegram Connection'}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-400 transition-all cursor-pointer font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-[0_4px_16px_rgba(59,130,246,0.3)] cursor-pointer font-mono"
                    >
                      Save Changes
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
