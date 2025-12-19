
import { create } from 'zustand';
import { LogEntry, ToastEntry } from '../../types/index';

interface ConnectionStore {
  mode: 'websocket' | 'mqtt';
  isConnected: boolean;
  logs: LogEntry[];
  toasts: ToastEntry[];
  setMode: (mode: 'websocket' | 'mqtt') => void;
  setConnected: (connected: boolean) => void;
  addLog: (direction: 'in' | 'out', raw: string, msg: string) => void;
  clearLogs: () => void;
  addToast: (message: string, type: ToastEntry['type']) => void;
  removeToast: (id: string) => void;
}

export const useConnection = create<ConnectionStore>((set) => ({
  mode: 'websocket',
  isConnected: false,
  logs: [],
  toasts: [],
  
  setMode: (mode) => set({ mode }),
  
  setConnected: (connected) => set((state) => {
    const id = Math.random().toString(36);
    // Only fire toast if status actually changes
    if (state.isConnected !== connected) {
      setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
      return { 
        isConnected: connected,
        toasts: [{ 
          id, 
          message: connected ? "Synced with Hardware" : "Hardware Offline", 
          type: connected ? 'success' : 'error' 
        }, ...state.toasts]
      };
    }
    return { isConnected: connected };
  }),

  addLog: (direction, raw, msg) => set((state) => ({
    logs: [{ id: Math.random().toString(36), timestamp: Date.now(), direction, raw, msg }, ...state.logs].slice(0, 30)
  })),

  clearLogs: () => set({ logs: [] }),

  addToast: (message, type) => set((state) => {
    const id = Math.random().toString(36);
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
    return { toasts: [{ id, message, type }, ...state.toasts] };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}));
