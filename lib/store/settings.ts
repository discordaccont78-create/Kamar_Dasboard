
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings } from '../../types/index';
import { redis } from '../db/redis';

// Extend AppSettings locally if needed, or rely on type augmentation. 
interface ExtendedAppSettings extends AppSettings {
  title: string;
  enableNotifications: boolean;
  primaryColor: string;
  cursorColor: string; // New Third Color for Cursor & Background Accent
  language: 'en' | 'fa';
  dashboardFont: 'Inter' | 'Oswald' | 'Lato' | 'Montserrat' | 'DinaRemaster' | 'PrpggyDotted';
  enableSFX: boolean; // New: Toggle for UI Sound Effects (Clicks, Toggles)
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
        enableSFX: true, // Default to ON for better UX
        volume: 30,
        theme: 'dark',
        useSsl: typeof window !== 'undefined' ? window.location.protocol.includes('https') : false,
        currentTrackIndex: 0,
        enableNotifications: true,
        primaryColor: "#daa520", // Default Gold
        cursorColor: "#daa520", // Default Cursor Color (Matches Gold initially)
        language: 'en',
        dashboardFont: 'Inter',
        backgroundEffect: 'grid',
        dualColorBackground: false, // Default to single color (grey)
        hollowShapes: false, // Default to Solid
        enableTextPattern: false, 
        textPatternValue: "KAMYAR",
        patternOpacity: 15,
        secondaryPatternOpacity: 20,
        
        // Grid Defaults
        gridStrokeWidth: 1,
        gridLineStyle: 'solid',
        gridSize: 32
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