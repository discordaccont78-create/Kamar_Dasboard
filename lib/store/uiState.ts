
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
  };
  setOutputForm: (data: Partial<UIState['outputForm']>) => void;

  inputForm: { gpio: string; name: string; group: string; trigger: string };
  setInputForm: (data: Partial<UIState['inputForm']>) => void;

  regForm: { ds: string; shcp: string; stcp: string; group: string };
  setRegForm: (data: Partial<UIState['regForm']>) => void;

  dhtForm: { gpio: string; name: string; group: string };
  setDhtForm: (data: Partial<UIState['dhtForm']>) => void;

  timerForm: { hours: number; minutes: number; seconds: number; targetSegmentId: string };
  setTimerForm: (data: Partial<UIState['timerForm']>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Default: All sections closed
      activeSection: null,
      setActiveSection: (section) => set({ activeSection: section }),

      outputForm: { gpio: '', name: '', type: 'Digital', group: '', onOffMode: 'toggle' },
      setOutputForm: (data) => set((state) => ({ outputForm: { ...state.outputForm, ...data } })),

      inputForm: { gpio: '', name: '', group: '', trigger: '1' },
      setInputForm: (data) => set((state) => ({ inputForm: { ...state.inputForm, ...data } })),

      regForm: { ds: '', shcp: '', stcp: '', group: '' },
      setRegForm: (data) => set((state) => ({ regForm: { ...state.regForm, ...data } })),

      dhtForm: { gpio: '', name: '', group: '' },
      setDhtForm: (data) => set((state) => ({ dhtForm: { ...state.dhtForm, ...data } })),

      timerForm: { hours: 0, minutes: 0, seconds: 0, targetSegmentId: '' },
      setTimerForm: (data) => set((state) => ({ timerForm: { ...state.timerForm, ...data } })),
    }),
    {
      name: 'ui-state-storage',
      storage: createJSONStorage(() => localStorage), // Persist to LocalStorage
    }
  )
);
