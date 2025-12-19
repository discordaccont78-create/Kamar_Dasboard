
import { create } from 'zustand';

interface DataPoint {
  time: string;
  value: number;
}

interface AnalyticsStore {
  sensorHistory: Record<string, { temp: DataPoint[], hum: DataPoint[] }>;
  trafficHistory: { time: string; rx: number; tx: number }[];
  addSensorReading: (id: string, type: 'temp' | 'hum', value: number) => void;
  addTrafficSample: (rx: number, tx: number) => void;
}

export const useAnalytics = create<AnalyticsStore>((set) => ({
  sensorHistory: {},
  trafficHistory: Array(20).fill({ time: '', rx: 0, tx: 0 }), // Pre-fill for smoothness
  
  addSensorReading: (id, type, value) => set((state) => {
    const prev = state.sensorHistory[id] || { temp: [], hum: [] };
    const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Filter out old points to keep array size manageable (e.g., 20 points)
    const currentPoints = prev[type];
    const newPoints = [...currentPoints, { time: now, value }].slice(-20);
    
    return {
      sensorHistory: {
        ...state.sensorHistory,
        [id]: { ...prev, [type]: newPoints }
      }
    };
  }),

  addTrafficSample: (rx, tx) => set((state) => {
    const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newHistory = [...state.trafficHistory, { time: now, rx, tx }].slice(-20);
    return { trafficHistory: newHistory };
  })
}));
