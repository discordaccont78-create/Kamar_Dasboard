
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../../types/index';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        domain: "iot-device",
        animations: true,
        bgMusic: false,
        volume: 30,
        theme: 'dark',
        useSsl: typeof window !== 'undefined' ? window.location.protocol.includes('https') : false,
        currentTrackIndex: 0
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
    }),
    { name: 'settings-storage' }
  )
);
