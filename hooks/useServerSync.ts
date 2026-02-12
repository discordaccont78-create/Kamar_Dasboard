
import { useEffect, useState, useRef } from 'react';
import { useSettingsStore } from '../lib/store/settings';
import { useSegments } from '../lib/store/segments';
import { useSchedulerStore } from '../lib/store/scheduler';
import { fetchSystemConfig, saveSettings, saveSegments, saveSchedules } from '../lib/api/server';

export function useServerSync() {
  const [isReady, setIsReady] = useState(false);
  
  // Stores
  const { settings, updateSettings } = useSettingsStore();
  const { segments, groups, setSegments, setGroups } = useSegments();
  const { schedules, setSchedules } = useSchedulerStore();
  
  const isInitialLoad = useRef(true);

  // 1. Initial Full Fetch (Bootstrapping)
  useEffect(() => {
    const init = async () => {
      const config = await fetchSystemConfig();
      if (config) {
        // Batch updates to prevent multiple re-renders
        if (config.settings) updateSettings(config.settings);
        if (config.groups) setGroups(config.groups);
        if (config.segments) setSegments(config.segments);
        if (config.schedules) setSchedules(config.schedules);
      }
      setIsReady(true);
      // Allow a small buffer before enabling auto-save to prevent echoing back the initial fetch
      setTimeout(() => {
          isInitialLoad.current = false;
      }, 1000);
    };
    init();
  }, [setSegments, updateSettings, setSchedules, setGroups]);

  // 2. Settings Watcher (Fast Debounce: 1s)
  useEffect(() => {
    if (isInitialLoad.current) return;
    const timeout = setTimeout(() => {
        saveSettings(useSettingsStore.getState().settings);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [settings]);

  // 3. Segments & Groups Watcher (Slower Debounce: 2s)
  // These are heavier operations (Drag & Drop, New Device)
  useEffect(() => {
    if (isInitialLoad.current) return;
    const timeout = setTimeout(() => {
        const state = useSegments.getState();
        saveSegments({ segments: state.segments, groups: state.groups });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [segments, groups]);

  // 4. Schedules Watcher (Standard Debounce: 1.5s)
  useEffect(() => {
    if (isInitialLoad.current) return;
    const timeout = setTimeout(() => {
        saveSchedules(useSchedulerStore.getState().schedules);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [schedules]);

  return { isReady };
}
