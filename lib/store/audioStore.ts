
import { create } from 'zustand';

interface AudioState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seekRequest: number | null; // New: Holds the requested timestamp to jump to
  setAudioState: (time: number, duration: number, isPlaying: boolean) => void;
  requestSeek: (time: number) => void; // New: Action to trigger a seek
  clearSeekRequest: () => void; // New: Action to clear the request after handling
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  seekRequest: null,
  setAudioState: (currentTime, duration, isPlaying) => set({ currentTime, duration, isPlaying }),
  requestSeek: (time) => set({ seekRequest: time }),
  clearSeekRequest: () => set({ seekRequest: null }),
  reset: () => set({ currentTime: 0, duration: 0, isPlaying: false, seekRequest: null }),
}));
