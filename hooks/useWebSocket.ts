
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
          
          // Helper to update segment by GPIO
          const updateSegmentByGpio = (gpio: number, updates: Partial<Segment>) => {
            const currentSegments = useSegments.getState().segments;
            const seg = currentSegments.find(s => s.gpio === gpio && s.groupType !== 'register');
            if (seg) {
                queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => {
                    if (!old) return undefined;
                    return { ...old, ...updates };
                });
            }
          };
               
          switch (msg.cmd) {
            case CMD.LED_ON: 
                updateSegmentByGpio(msg.seg, { is_led_on: 'on' });
                break;
            case CMD.LED_OFF: 
                updateSegmentByGpio(msg.seg, { is_led_on: 'off' });
                break;
            case CMD.LED_PWM: 
                updateSegmentByGpio(msg.seg, { val_of_slide: msg.val });
                break;
            case CMD.TEMP_DATA: {
                const temp = msg.val / 10;
                // For Weather, msg.seg is likely the DHT pin
                const currentSegments = useSegments.getState().segments;
                const seg = currentSegments.find(s => s.dhtPin === msg.seg);
                if (seg) {
                    queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => 
                        old ? { ...old, temperature: temp } : undefined
                    );
                    addSensorReading(seg.num_of_node, 'temp', temp);
                }
                break;
            }
            case CMD.HUM_DATA: {
                const hum = msg.val / 10;
                const currentSegments = useSegments.getState().segments;
                const seg = currentSegments.find(s => s.dhtPin === msg.seg);
                if (seg) {
                    queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => 
                        old ? { ...old, humidity: hum } : undefined
                    );
                    addSensorReading(seg.num_of_node, 'hum', hum);
                }
                break;
            }
            case CMD.GPIO_STATE: 
                updateSegmentByGpio(msg.seg, { inputActive: msg.val === 1 });
                break;
            case CMD.BTN_INPUT: 
                // Handles direct input changes (e.g. from physical button press)
                updateSegmentByGpio(msg.seg, { inputActive: msg.val === 1 });
                break;
            case CMD.GPIO_BATCH: {
                const { gpios, states } = protocolRef.current.decodeBatchGPIO(msg.val, msg.seg);
                gpios.forEach((gpio, idx) => {
                    updateSegmentByGpio(gpio, { is_led_on: states[idx] ? 'on' : 'off' });
                });
                break;
            }
            case CMD.SR_STATE: 
                // SR_STATE usually updates a register group. 
                // We need to find segments attached to this Latch Pin (msg.seg)
                const currentSegments = useSegments.getState().segments;
                const regSegments = currentSegments.filter(s => s.gpio === msg.seg && s.groupType === 'register');
                
                regSegments.forEach(s => {
                    if (s.regBitIndex !== undefined) {
                        const isOn = ((msg.val >> s.regBitIndex) & 1) === 1;
                        queryClient.setQueryData(['device', s.num_of_node], (old: Segment | undefined) => 
                            old ? { ...old, is_led_on: isOn ? 'on' : 'off' } : undefined
                        );
                    }
                });
                break;
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
