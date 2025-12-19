
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketManager } from '../lib/connection/websocket';
import { BinaryProtocol } from '../lib/connection/protocol';
import { useConnection } from '../lib/store/connection';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useAnalytics } from '../lib/store/analytics';
import { CMD, Segment } from '../types/index';

export function useWebSocket() {
  const wsRef = useRef<WebSocketManager | null>(null);
  const protocolRef = useRef(new BinaryProtocol());
  
  const { setConnected, addLog, addToast } = useConnection();
  // Only read structure from store, updates happen via React Query or store actions
  const segments = useSegments((state) => state.segments);
  const settings = useSettingsStore((state) => state.settings);
  const { addSensorReading, addTrafficSample } = useAnalytics();
  const queryClient = useQueryClient();
  
  // Analytics counters
  const rxCount = useRef<number>(0);
  const txCount = useRef<number>(0);

  // Traffic Monitor Interval
  useEffect(() => {
    const interval = setInterval(() => {
        addTrafficSample(rxCount.current, txCount.current);
        rxCount.current = 0;
        txCount.current = 0;
    }, 2000);
    return () => clearInterval(interval);
  }, [addTrafficSample]);

  useEffect(() => {
    const cleanDomain = settings.domain.replace(/^(ws|wss):\/\//, '').trim();
    if (!cleanDomain) return;

    const protocol = settings.useSsl ? 'wss' : 'ws';
    const url = `${protocol}://${cleanDomain}.local/ws`;

    const socket = new WebSocketManager(url);
    wsRef.current = socket;

    socket.onStatus(setConnected);
    
    socket.onMessage((data: ArrayBuffer | string) => {
      rxCount.current++;
      
      if (data instanceof ArrayBuffer) {
        const msg = protocolRef.current.decode(data);
        if (msg) {
          const hex = Array.from(new Uint8Array(data))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
            
          addLog('in', hex, `CMD:${msg.cmd} SEG:${msg.seg} VAL:${msg.val}`);
          
          // Identify segment by GPIO
          const currentSegments = useSegments.getState().segments;
          const seg = currentSegments.find(s => s.gpio === msg.seg);
          
          if (seg) {
            // Update React Query Cache
            queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined): Segment | undefined => {
               if (!old) return undefined;
               
               const updates: Partial<Segment> = {};
               
               switch (msg.cmd) {
                 case CMD.LED_ON: updates.is_led_on = 'on'; break;
                 case CMD.LED_OFF: updates.is_led_on = 'off'; break;
                 case CMD.LED_PWM: updates.val_of_slide = msg.val; break;
                 case CMD.TEMP_DATA: 
                   updates.temperature = msg.val / 10;
                   addSensorReading(seg.num_of_node, 'temp', updates.temperature);
                   break;
                 case CMD.HUM_DATA: 
                   updates.humidity = msg.val / 10;
                   addSensorReading(seg.num_of_node, 'hum', updates.humidity);
                   break;
                 case CMD.GPIO_STATE: updates.inputActive = msg.val === 1; break;
                 case CMD.SR_STATE: updates.val_of_slide = msg.val; break;
               }
               
               return { ...old, ...updates };
            });
          }
        }
      }
    });

    try {
      socket.connect();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Connection Error';
      addToast(`Security Error: ${errorMessage}`, "error");
    }

    return () => {
      socket.disconnect();
    };
  }, [settings.domain, settings.useSsl, setConnected, addLog, addToast, queryClient, addSensorReading]);

  const sendCommand = (cmd: number, gpio: number, value: number): boolean => {
    txCount.current++;
    
    const buffer = protocolRef.current.encode(cmd, gpio, value);
    const success = wsRef.current?.send(buffer) || false;
    
    if (success) {
      const hex = Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      addLog('out', hex, `CMD:${cmd} GPIO:${gpio} VAL:${value}`);
    } else {
      addToast("Failed: Device Offline", "error");
    }
    return success;
  };

  return { sendCommand };
}
