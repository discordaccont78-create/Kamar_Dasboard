
import { create } from 'zustand';

interface CursorState {
  isCharged: boolean;
  setCharged: (isCharged: boolean) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  isCharged: false,
  setCharged: (isCharged) => set({ isCharged }),
}));
