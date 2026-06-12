import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  telegramBotToken: string;
  telegramChatId: string;
  setTelegramCredentials: (token: string, chatId: string) => void;
  clearTelegramCredentials: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      telegramBotToken: '',
      telegramChatId: '',
      setTelegramCredentials: (token, chatId) =>
        set({
          telegramBotToken: token,
          telegramChatId: chatId,
        }),
      clearTelegramCredentials: () =>
        set({
          telegramBotToken: '',
          telegramChatId: '',
        }),
    }),
    {
      name: 'github-manager-settings',
    }
  )
);
