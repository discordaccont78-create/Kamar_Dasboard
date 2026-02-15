
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Segment, GroupConfig } from '../../types/index';
import { redis } from '../db/redis';

interface SegmentsStore {
  groups: GroupConfig[];
  segments: Segment[];
  
  // Group Actions
  addGroup: (group: GroupConfig) => void;
  addSpacerGroup: () => void; // New Action
  updateGroup: (id: string, data: Partial<GroupConfig>) => void;
  removeGroup: (id: string) => void;
  setGroups: (groups: GroupConfig[]) => void;
  reorderGroups: (newOrder: GroupConfig[]) => void; // Explicit reorder action
  
  // Segment Actions
  addSegment: (segment: Segment) => void;
  replaceSegment: (oldId: string, newSegment: Segment) => void; 
  removeSegment: (id: string) => void;
  updateSegment: (id: string, data: Partial<Segment>) => void;
  toggleSegment: (id: string) => void;
  setPWM: (id: string, value: number) => void;
  setSegments: (segments: Segment[]) => void;
}

const debounce = (fn: Function, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const debouncedRedisStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await redis.get(name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: debounce(async (name: string, value: string): Promise<void> => {
    await redis.set(name, JSON.parse(value));
  }, 1000),
  removeItem: async (name: string): Promise<void> => {
    await redis.del(name);
  },
};

export const useSegments = create<SegmentsStore>()(
  persist(
    (set) => ({
      groups: [],
      segments: [],
      
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group].sort((a,b) => a.order - b.order)
      })),

      addSpacerGroup: () => set((state) => {
        const newOrder = state.groups.length;
        const spacer: GroupConfig = {
            id: `spacer-group-${Date.now()}`,
            name: "Empty Group",
            order: newOrder,
            type: 'spacer',
            columnCount: 1
        };
        return { groups: [...state.groups, spacer] };
      }),

      updateGroup: (id, data) => set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, ...data } : g)
      })),

      removeGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id),
        segments: state.segments.filter(s => s.groupId !== id)
      })),

      setGroups: (groups) => set({ groups }),

      reorderGroups: (newOrder) => set({ groups: newOrder }),

      addSegment: (segment) => set((state) => ({
        segments: [...state.segments, segment]
      })),

      replaceSegment: (oldId, newSegment) => set((state) => ({
        segments: state.segments.map(s => s.num_of_node === oldId ? newSegment : s)
      })),
      
      removeSegment: (id) => set((state) => ({
        segments: state.segments.filter(s => s.num_of_node !== id)
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

      setSegments: (segments) => set({ segments }),
    }),
    { 
      name: 'segments-redis-store',
      storage: createJSONStorage(() => debouncedRedisStorage)
    }
  )
);
