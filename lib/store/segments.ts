
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Segment } from '../../types/index';
import { redis } from '../db/redis';

interface SegmentsStore {
  segments: Segment[];
  addSegment: (segment: Segment) => void;
  removeSegment: (id: string) => void;
  removeGroup: (groupName: string) => void;
  updateSegment: (id: string, data: Partial<Segment>) => void;
  toggleSegment: (id: string) => void;
  setPWM: (id: string, value: number) => void;
  setSegmentTimer: (id: string, durationSeconds: number) => void; // New
  clearSegmentTimer: (id: string) => void; // New
  setSegments: (segments: Segment[]) => void;
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

export const useSegments = create<SegmentsStore>()(
  persist(
    (set) => ({
      segments: [],
      
      addSegment: (segment) => set((state) => ({
        segments: [...state.segments, segment]
      })),
      
      removeSegment: (id) => set((state) => ({
        segments: state.segments.filter(s => s.num_of_node !== id)
      })),

      removeGroup: (groupName) => set((state) => ({
        segments: state.segments.filter(s => (s.group || "basic") !== groupName)
      })),
      
      updateSegment: (id, data) => set((state) => ({
        segments: state.segments.map(s => 
          s.num_of_node === id ? { ...s, ...data } : s
        )
      })),
      
      toggleSegment: (id) => set((state) => ({
        segments: state.segments.map(s => 
          s.num_of_node === id 
            ? { ...s, is_led_on: s.is_led_on === 'on' ? 'off' : 'on' }
            : s
        )
      })),
      
      setPWM: (id, value) => set((state) => ({
        segments: state.segments.map(s => 
          s.num_of_node === id ? { ...s, val_of_slide: value } : s
        )
      })),

      setSegmentTimer: (id, durationSeconds) => set((state) => ({
        segments: state.segments.map(s => 
          s.num_of_node === id 
            ? { ...s, timerFinishAt: Date.now() + (durationSeconds * 1000) } 
            : s
        )
      })),

      clearSegmentTimer: (id) => set((state) => ({
        segments: state.segments.map(s => {
          if (s.num_of_node === id) {
            const { timerFinishAt, ...rest } = s;
            return rest as Segment;
          }
          return s;
        })
      })),

      setSegments: (segments) => set({ segments }),
    }),
    { 
      name: 'segments-redis-store',
      storage: createJSONStorage(() => redisStorage) 
    }
  )
);
