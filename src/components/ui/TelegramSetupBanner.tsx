import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, X } from 'lucide-react';
import { isTelegramConfigured } from '../../lib/telegram';

const DISMISSED_KEY = 'telegram-banner-dismissed';

export const TelegramSetupBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });
  const [expanded, setExpanded] = useState(false);

  // Don't render if already configured or dismissed
  if (isTelegramConfigured() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-blue-500/15 text-blue-400">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Enable Telegram Backup</p>
              <p className="text-xs text-muted-foreground">
                Auto-backup deleted/archived repos as ZIPs to your private Telegram chat before they're gone forever.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors text-xs flex items-center gap-1 cursor-pointer font-mono"
            >
              {expanded ? <>Hide<ChevronUp className="h-3 w-3" /></> : <>Setup Guide<ChevronDown className="h-3 w-3" /></>}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-blue-500/15 px-4 py-4 space-y-3 text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2.5 text-xs">
                  <li>
                    Search for{' '}
                    <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-mono font-bold">
                      @BotFather
                    </a>{' '}
                    on Telegram, send <code className="bg-white/10 px-1 rounded font-mono">/newbot</code>, and copy the **Bot Token**.
                  </li>
                  <li>
                    Search for{' '}
                    <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-mono font-bold">
                      @userinfobot
                    </a>{' '}
                    to obtain your account's numeric **Chat ID**.
                  </li>
                  <li>
                    Open a direct chat with your new bot and send it{' '}
                    <code className="bg-white/10 px-1 rounded font-mono">/start</code> (required for the bot to message you).
                  </li>
                  <li>
                    Click the **Settings Gear** at the top of this dashboard, paste your credentials, and click **Save Changes**!
                  </li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
