
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings } from '../../types/index';
import { redis } from '../db/redis';

// Extend AppSettings locally if needed, or rely on type augmentation. 
interface ExtendedAppSettings extends AppSettings {
  title: string;
  enableNotifications: boolean;
  primaryColor: string;
  language: 'en' | 'fa';
}

interface SettingsStore {
  settings: ExtendedAppSettings;
  updateSettings: (updates: Partial<ExtendedAppSettings>) => void;
}

// Define storage adapter for Zustand
const redisStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await redis.get(name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await redis.set(name, JSON.parse(value));
  },
  removeItem: async (name: string): Promise<void> => {
    await redis.del(name);
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        title: "Kamyar Pro IoT", // Default Title
        domain: "iot-device",
        animations: true,
        bgMusic: false,
        volume: 30,
        theme: 'dark',
        useSsl: typeof window !== 'undefined' ? window.location.protocol.includes('https') : false,
        currentTrackIndex: 0,
        enableNotifications: true,
        primaryColor: "#daa520", // Default Gold
        language: 'en',
        dashboardFont: 'Inter'
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
    }),
    { 
      name: 'settings-redis-store',
      storage: createJSONStorage(() => redisStorage)
    }
  )
);
