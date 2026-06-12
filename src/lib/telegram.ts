import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

export interface TelegramBackupResult {
  ok: boolean;
  messageId?: number;
  fileId?: string;
  error?: string;
}

/**
 * Returns true if Telegram credentials are configured.
 */
export const isTelegramConfigured = (): boolean => {
  const { telegramBotToken, telegramChatId } = useSettingsStore.getState();
  return !!(telegramBotToken && telegramChatId);
};

export interface BackupMetadata {
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  stars: number;
}

/**
 * Sends repo info to our backend /api/telegram endpoint.
 * The backend handles GitHub zip download + Telegram upload entirely server-side.
 * No CORS issues, no browser file handling.
 */
export const backupRepoToTelegram = async (
  owner: string,
  repo: string,
  meta: BackupMetadata,
  mode: 'backup' | 'delete' | 'leave' | 'transfer' = 'delete'
): Promise<TelegramBackupResult> => {
  try {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { ok: false, error: 'Not authenticated' };
    }

    const { telegramBotToken, telegramChatId } = useSettingsStore.getState();
    const payloadBody: any = { owner, repo, token, meta, mode };

    if (telegramBotToken && telegramChatId) {
      payloadBody.botToken = telegramBotToken;
      payloadBody.chatId = telegramChatId;
    }

    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody),
    });

    const data = await response.json() as { ok: boolean; message_id?: number; file_id?: string; error?: string };

    if (!data.ok) {
      return { ok: false, error: data.error || `Server responded with ${response.status}` };
    }

    return { ok: true, messageId: data.message_id, fileId: data.file_id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
};

