
import { useEffect } from 'react';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useWebSocket } from './useWebSocket';
import { useConnection } from '../lib/store/connection';
import { CMD } from '../types/index';

export function useSchedulerEngine() {
  const { schedules, updateLastRun } = useSchedulerStore();
  const { segments, toggleSegment } = useSegments();
  const { settings } = useSettingsStore();
  const { sendCommand } = useWebSocket();
  const { addToast } = useConnection();

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
                    let cmdToSend = CMD.LED_ON; // default
                    
                    if (schedule.action === 'ON') cmdToSend = CMD.LED_ON;
                    if (schedule.action === 'OFF') cmdToSend = CMD.LED_OFF;
                    
                    // Special logic for Toggle
                    if (schedule.action === 'TOGGLE') {
                        toggleSegment(segment.num_of_node);
                        const newState = segment.is_led_on === 'on' ? 'off' : 'on'; // Inverted
                        cmdToSend = newState === 'on' ? CMD.LED_ON : CMD.LED_OFF;
                    } else if (schedule.action === 'ON') {
                         if(segment.is_led_on !== 'on') toggleSegment(segment.num_of_node);
                    } else if (schedule.action === 'OFF') {
                         if(segment.is_led_on !== 'off') toggleSegment(segment.num_of_node);
                    }

                    // Send Hardware Command
                    sendCommand(cmdToSend, segment.gpio || 0, 0);
                    
                    // Update Timestamp
                    updateLastRun(schedule.id, currentTimestamp);
                    
                    // Localized Notification
                    const actionLabel = schedule.action === 'ON' ? (settings.language === 'fa' ? 'روشن' : 'ON') 
                                      : schedule.action === 'OFF' ? (settings.language === 'fa' ? 'خاموش' : 'OFF') 
                                      : (settings.language === 'fa' ? 'تغییر وضعیت' : 'TOGGLED');

                    const msg = settings.language === 'fa'
                        ? `وظیفه خودکار اجرا شد: ${segment.name} -> ${actionLabel}`
                        : `Auto-Task Executed: ${segment.name} turned ${actionLabel}`;

                    addToast(msg, 'info');
                }
            }
        });

    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [schedules, segments, sendCommand, updateLastRun, toggleSegment, addToast, settings.language]);
}
