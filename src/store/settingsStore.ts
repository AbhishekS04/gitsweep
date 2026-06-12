import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  telegramBotToken: string;
  telegramChatId: string;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  setTelegramCredentials: (token: string, chatId: string) => void;
  clearTelegramCredentials: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      telegramBotToken: '',
      telegramChatId: '',
      settingsModalOpen: false,
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
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
      partialize: (state) => ({
        telegramBotToken: state.telegramBotToken,
        telegramChatId: state.telegramChatId,
      }),
    }
  )
);
