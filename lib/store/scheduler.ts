
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Schedule } from '../../types/index';
import { redis } from '../db/redis';

interface SchedulerStore {
  schedules: Schedule[];
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  updateLastRun: (id: string, timestamp: number) => void;
}

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

export const useSchedulerStore = create<SchedulerStore>()(
  persist(
    (set) => ({
      schedules: [],
      
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule]
      })),
      
      removeSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(s => s.id !== id)
      })),
      
      toggleSchedule: (id) => set((state) => ({
        schedules: state.schedules.map(s => 
          s.id === id ? { ...s, enabled: !s.enabled } : s
        )
      })),

      updateLastRun: (id, timestamp) => set((state) => ({
        schedules: state.schedules.map(s => 
            s.id === id ? { ...s, lastRun: timestamp } : s
        )
      })),
    }),
    { 
      name: 'scheduler-store',
      storage: createJSONStorage(() => redisStorage)
    }
  )
);
