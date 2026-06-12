import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  useCustomTelegram: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  setUseCustomTelegram: (useCustom: boolean) => void;
  setTelegramCredentials: (token: string, chatId: string) => void;
  clearTelegramCredentials: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useCustomTelegram: false,
      telegramBotToken: '',
      telegramChatId: '',
      setUseCustomTelegram: (useCustom) => set({ useCustomTelegram: useCustom }),
      setTelegramCredentials: (token, chatId) =>
        set({
          telegramBotToken: token,
          telegramChatId: chatId,
          useCustomTelegram: true,
        }),
      clearTelegramCredentials: () =>
        set({
          telegramBotToken: '',
          telegramChatId: '',
          useCustomTelegram: false,
        }),
    }),
    {
      name: 'github-manager-settings',
    }
  )
);
