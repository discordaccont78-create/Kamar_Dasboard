
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useWebSocket } from './useWebSocket';
import { useConnection } from '../lib/store/connection';
import { CMD, Segment } from '../types/index';

export function useSchedulerEngine() {
  const { schedules, updateLastRun } = useSchedulerStore();
  const { segments, updateSegment } = useSegments(); // Use updateSegment instead of toggle
  const { settings } = useSettingsStore();
  const { sendCommand } = useWebSocket();
  const { addToast } = useConnection();
  const queryClient = useQueryClient(); // Access React Query Cache

  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMinutes}`;
        const currentTimestamp = now.getTime();

        schedules.forEach(schedule => {
            if (!schedule.enabled) return;

            // Check match
            if (schedule.time === currentTimeString) {
                // Check if already ran this minute (debounce)
                const lastRun = schedule.lastRun || 0;
                if (currentTimestamp - lastRun < 60000) {
                    return;
                }

                // Execute Logic
                const segment = segments.find(s => s.num_of_node === schedule.targetSegmentId);
                
                if (segment) {
                    let targetState: 'on' | 'off' = 'off';
                    let cmdToSend = CMD.LED_OFF;

                    // Determine Target State
                    if (schedule.action === 'ON') {
                        targetState = 'on';
                        cmdToSend = CMD.LED_ON;
                    } else if (schedule.action === 'OFF') {
                        targetState = 'off';
                        cmdToSend = CMD.LED_OFF;
                    } else if (schedule.action === 'TOGGLE') {
                        // Invert current state
                        targetState = segment.is_led_on === 'on' ? 'off' : 'on';
                        cmdToSend = targetState === 'on' ? CMD.LED_ON : CMD.LED_OFF;
                    }

                    // 1. Send Hardware Command
                    const success = sendCommand(cmdToSend, segment.gpio || 0, 0);
                    
                    // 2. Update UI Source of Truth (React Query Cache)
                    // This forces the CustomSegment component to re-render immediately
                    queryClient.setQueryData(['device', segment.num_of_node], (old: Segment | undefined) => {
                        if (!old) return undefined;
                        return { ...old, is_led_on: targetState };
                    });

                    // 3. Update Global Store (Zustand)
                    updateSegment(segment.num_of_node, { is_led_on: targetState });

                    // 4. Update Timestamp to prevent double-fire
                    updateLastRun(schedule.id, currentTimestamp);
                    
                    // 5. Notification
                    const actionLabel = targetState === 'on' ? (settings.language === 'fa' ? 'روشن' : 'ON') : (settings.language === 'fa' ? 'خاموش' : 'OFF');

                    if (success) {
                        const msg = settings.language === 'fa'
                            ? `وظیفه خودکار: ${segment.name} -> ${actionLabel}`
                            : `Auto-Task: ${segment.name} turned ${actionLabel}`;
                        addToast(msg, 'info');
                    } else {
                        const msg = settings.language === 'fa'
                            ? `خطا: دستگاه ${segment.name} پاسخ نمی‌دهد`
                            : `Task Failed: Device ${segment.name} unreachable`;
                        addToast(msg, 'error');
                    }

                } else {
                    // Segment not found
                    updateLastRun(schedule.id, currentTimestamp);
                    const msg = settings.language === 'fa'
                            ? `خطا: دستگاه برای برنامه ${schedule.time} پیدا نشد`
                            : `Error: Target device not found for ${schedule.time}`;
                    addToast(msg, 'error');
                }
            }
        });

    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [schedules, segments, sendCommand, updateLastRun, updateSegment, addToast, settings.language, queryClient]);
}
