
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Schedule } from '../../types/index';
import { redis } from '../db/redis';

interface SchedulerStore {
  schedules: Schedule[];
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  disableSchedule: (id: string) => void;
  updateLastRun: (id: string, timestamp: number) => void;
  decrementRepeat: (id: string) => void;
  removeSchedulesByTarget: (segmentId: string) => void;
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

      // Cleanup schedules when a segment is deleted
      removeSchedulesByTarget: (segmentId) => set((state) => ({
        schedules: state.schedules.filter(s => s.targetSegmentId !== segmentId)
      })),
      
      toggleSchedule: (id) => set((state) => ({
        schedules: state.schedules.map(s => {
          if (s.id === id) {
            const isEnabling = !s.enabled;
            // If we are enabling a countdown timer, reset the startedAt time
            if (isEnabling && s.type === 'countdown') {
                return { ...s, enabled: true, startedAt: Date.now() };
            }
            return { ...s, enabled: isEnabling };
          }
          return s;
        })
      })),

      disableSchedule: (id) => set((state) => ({
        schedules: state.schedules.map(s => 
          s.id === id ? { ...s, enabled: false } : s
        )
      })),

      updateLastRun: (id, timestamp) => set((state) => ({
        schedules: state.schedules.map(s => 
            s.id === id ? { ...s, lastRun: timestamp } : s
        )
      })),

      // New: Logic to handle repetition counts
      decrementRepeat: (id) => set((state) => ({
        schedules: state.schedules.map(s => {
          if (s.id === id && s.repeatMode === 'count' && (s.repeatCount || 0) > 0) {
            const newCount = (s.repeatCount || 0) - 1;
            // If count reaches 0, disable the schedule
            return { ...s, repeatCount: newCount, enabled: newCount > 0 };
          }
          return s;
        })
      })),
    }),
    { 
      name: 'scheduler-store',
      storage: createJSONStorage(() => redisStorage)
    }
  )
);
