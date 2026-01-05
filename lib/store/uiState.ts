
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SegmentType } from '../../types/index';

interface UIState {
  // Accordion State
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;

  // Form States
  outputForm: { 
    gpio: string; 
    name: string; 
    type: SegmentType; 
    group: string;
    onOffMode: 'toggle' | 'momentary';
    onLabel: string;
    offLabel: string;
  };
  setOutputForm: (data: Partial<UIState['outputForm']>) => void;

  inputForm: { gpio: string; name: string; group: string; trigger: string };
  setInputForm: (data: Partial<UIState['inputForm']>) => void;

  regForm: { ds: string; shcp: string; stcp: string; group: string };
  setRegForm: (data: Partial<UIState['regForm']>) => void;

  dhtForm: { gpio: string; name: string; group: string; type: 'DHT11' | 'DHT22' };
  setDhtForm: (data: Partial<UIState['dhtForm']>) => void;

  lcdForm: { 
    name: string; 
    group: string; 
    type: 'OLED' | 'CharLCD'; 
    sda: string; 
    scl: string; 
    address: string;
    // OLED specific
    resolution: '128x64' | '128x32';
    // LCD specific
    rows: string;
    cols: string;
  };
  setLcdForm: (data: Partial<UIState['lcdForm']>) => void;

  timerForm: { hours: number; minutes: number; seconds: number; targetSegmentId: string };
  setTimerForm: (data: Partial<UIState['timerForm']>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Default: All sections closed
      activeSection: null,
      setActiveSection: (section) => set({ activeSection: section }),

      outputForm: { gpio: '', name: '', type: 'Digital', group: '', onOffMode: 'toggle', onLabel: '', offLabel: '' },
      setOutputForm: (data) => set((state) => ({ outputForm: { ...state.outputForm, ...data } })),

      inputForm: { gpio: '', name: '', group: '', trigger: '1' },
      setInputForm: (data) => set((state) => ({ inputForm: { ...state.inputForm, ...data } })),

      regForm: { ds: '', shcp: '', stcp: '', group: '' },
      setRegForm: (data) => set((state) => ({ regForm: { ...state.regForm, ...data } })),

      dhtForm: { gpio: '', name: '', group: '', type: 'DHT11' },
      setDhtForm: (data) => set((state) => ({ dhtForm: { ...state.dhtForm, ...data } })),

      lcdForm: { 
        name: '', 
        group: '', 
        type: 'OLED', 
        sda: '21', 
        scl: '22', 
        address: '0x3C', 
        resolution: '128x64', 
        rows: '2', 
        cols: '16' 
      },
      setLcdForm: (data) => set((state) => ({ lcdForm: { ...state.lcdForm, ...data } })),

      timerForm: { hours: 0, minutes: 0, seconds: 0, targetSegmentId: '' },
      setTimerForm: (data) => set((state) => ({ timerForm: { ...state.timerForm, ...data } })),
    }),
    {
      name: 'ui-state-storage',
      storage: createJSONStorage(() => localStorage), // Persist to LocalStorage
    }
  )
);
