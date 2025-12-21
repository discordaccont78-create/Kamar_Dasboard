
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useWebSocket } from './useWebSocket';
import { useConnection } from '../lib/store/connection';
import { CMD, Segment } from '../types/index';

export function useSchedulerEngine() {
  const { schedules, updateLastRun, disableSchedule, decrementRepeat } = useSchedulerStore();
  const { segments, updateSegment } = useSegments(); 
  const { settings } = useSettingsStore();
  const { sendCommand } = useWebSocket();
  const { addToast } = useConnection();
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMinutes}`;
        const currentTimestamp = now.getTime();

        schedules.forEach(schedule => {
            if (!schedule.enabled) return;

            let shouldRun = false;

            // 1. Check Condition: Daily Time
            if (schedule.type === 'daily' || !schedule.type) { // Fallback for old data
                 if (schedule.time === currentTimeString) {
                     // Debounce: Check if already ran this minute
                     const lastRun = schedule.lastRun || 0;
                     if (currentTimestamp - lastRun > 60000) {
                         shouldRun = true;
                     }
                 }
            } 
            // 2. Check Condition: Countdown Timer
            else if (schedule.type === 'countdown') {
                const startTime = schedule.startedAt || 0;
                const durationMs = (schedule.duration || 0) * 1000;
                const finishTime = startTime + durationMs;

                if (currentTimestamp >= finishTime) {
                    shouldRun = true;
                }
            }

            if (shouldRun) {
                // Execute Logic
                const segment = segments.find(s => s.num_of_node === schedule.targetSegmentId);
                
                if (segment) {
                    let cmdToSend = CMD.LED_OFF;
                    let targetValForCmd = 0; // Default 0 for OFF
                    
                    // State updates for UI
                    const updates: Partial<Segment> = {};
                    let actionLabel = "";

                    // Determine Command & Target State
                    if (schedule.action === 'ON') {
                        cmdToSend = CMD.LED_ON;
                        updates.is_led_on = 'on';
                        actionLabel = settings.language === 'fa' ? 'روشن' : 'ON';

                    } else if (schedule.action === 'OFF') {
                        cmdToSend = CMD.LED_OFF;
                        updates.is_led_on = 'off';
                        actionLabel = settings.language === 'fa' ? 'خاموش' : 'OFF';

                    } else if (schedule.action === 'TOGGLE') {
                        const newState = segment.is_led_on === 'on' ? 'off' : 'on';
                        cmdToSend = newState === 'on' ? CMD.LED_ON : CMD.LED_OFF;
                        updates.is_led_on = newState;
                        actionLabel = settings.language === 'fa' 
                            ? (newState === 'on' ? 'روشن' : 'خاموش')
                            : (newState === 'on' ? 'ON' : 'OFF');

                    } else if (schedule.action === 'SET_VALUE') {
                        // PWM Logic
                        cmdToSend = CMD.LED_PWM;
                        targetValForCmd = schedule.targetValue || 0;
                        updates.val_of_slide = targetValForCmd;
                        actionLabel = `PWM: ${targetValForCmd}`;
                    }

                    // 1. Send Hardware Command
                    const success = sendCommand(cmdToSend, segment.gpio || 0, targetValForCmd);
                    
                    // 2. Update UI Source of Truth (React Query Cache)
                    queryClient.setQueryData(['device', segment.num_of_node], (old: Segment | undefined) => {
                        if (!old) return undefined;
                        return { ...old, ...updates };
                    });

                    // 3. Update Global Store (Zustand)
                    updateSegment(segment.num_of_node, updates);

                    // 4. Update Timestamp
                    updateLastRun(schedule.id, currentTimestamp);

                    // 5. Handle Repetition & Countdown Logic
                    if (schedule.type === 'countdown') {
                        // Timers are always one-shot unless re-enabled manually
                        disableSchedule(schedule.id);
                    } else {
                        // Daily Schedule Logic
                        if (schedule.repeatMode === 'once') {
                            disableSchedule(schedule.id);
                        } else if (schedule.repeatMode === 'count') {
                            decrementRepeat(schedule.id);
                        }
                    }
                    
                    // 6. Notification
                    if (success) {
                        const msg = settings.language === 'fa'
                            ? `وظیفه خودکار: ${segment.name} -> ${actionLabel}`
                            : `Auto-Task: ${segment.name} set to ${actionLabel}`;
                        addToast(msg, 'info');
                    } else {
                        const msg = settings.language === 'fa'
                            ? `خطا: دستگاه ${segment.name} پاسخ نمی‌دهد`
                            : `Task Failed: Device ${segment.name} unreachable`;
                        addToast(msg, 'error');
                    }

                } else {
                    // Segment not found, but mark as run to prevent loops
                    updateLastRun(schedule.id, currentTimestamp);
                    if (schedule.type === 'countdown') disableSchedule(schedule.id);
                }
            }
        });

    }, 1000); 

    return () => clearInterval(interval);
  }, [schedules, segments, sendCommand, updateLastRun, disableSchedule, decrementRepeat, updateSegment, addToast, settings.language, queryClient]);
}
