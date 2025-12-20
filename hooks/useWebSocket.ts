
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

// Singleton Instance
let sharedSocket: WebSocketManager | null = null;
let activeSubscribers = 0;

export function useWebSocket() {
  const protocolRef = useRef(new BinaryProtocol());
  
  const { setConnected, addLog, addToast } = useConnection();
  const settings = useSettingsStore((state) => state.settings);
  const { addSensorReading } = useAnalytics();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // 1. Sanitize Domain input (remove protocols if user typed them)
    const cleanDomain = settings.domain.replace(/^(ws|wss|http|https):\/\//, '').trim();
    if (!cleanDomain) return;

    // 2. Security Check: If page is HTTPS, we MUST use WSS.
    // Browsers block "ws://" from "https://" pages (Mixed Content).
    const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const protocol = (settings.useSsl || isSecureContext) ? 'wss' : 'ws';
    
    // 3. Construct URL
    // Note: We maintain the .local suffix for mDNS compatibility as per original design.
    // Ideally, users should type the IP directly if not using mDNS.
    const url = `${protocol}://${cleanDomain}.local/ws`;

    // Initialize Singleton if not exists or URL changed
    if (!sharedSocket || (sharedSocket as any)['url'] !== url) {
        if (sharedSocket) {
            sharedSocket.disconnect();
        }
        sharedSocket = new WebSocketManager(url);
        // Monkey-patch to track URL for change detection
        (sharedSocket as any)['url'] = url; 
    }

    activeSubscribers++;
    const socket = sharedSocket;

    socket.onStatus(setConnected);
    
    socket.onMessage((data: ArrayBuffer | string) => {
      if (data instanceof ArrayBuffer) {
        const msg = protocolRef.current.decode(data);
        if (msg) {
          const hex = Array.from(new Uint8Array(data))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
            
          addLog('in', hex, `CMD:${msg.cmd} SEG:${msg.seg} VAL:${msg.val}`);
          
          const updateSegmentByGpio = (gpio: number, updates: Partial<Segment>) => {
            const currentSegments = useSegments.getState().segments;
            const matchedSegments = currentSegments.filter(s => s.gpio === gpio && s.groupType !== 'register');
            
            matchedSegments.forEach(seg => {
                queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => {
                    if (!old) return undefined;
                    return { ...old, ...updates };
                });
                useSegments.getState().updateSegment(seg.num_of_node, updates);
            });
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
                const currentSegments = useSegments.getState().segments;
                const seg = currentSegments.find(s => s.dhtPin === msg.seg);
                if (seg) {
                    const updates = { temperature: temp };
                    queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => 
                        old ? { ...old, ...updates } : undefined
                    );
                    useSegments.getState().updateSegment(seg.num_of_node, updates);
                    addSensorReading(seg.num_of_node, 'temp', temp);
                }
                break;
            }
            case CMD.HUM_DATA: {
                const hum = msg.val / 10;
                const currentSegments = useSegments.getState().segments;
                const seg = currentSegments.find(s => s.dhtPin === msg.seg);
                if (seg) {
                    const updates = { humidity: hum };
                    queryClient.setQueryData(['device', seg.num_of_node], (old: Segment | undefined) => 
                        old ? { ...old, ...updates } : undefined
                    );
                    useSegments.getState().updateSegment(seg.num_of_node, updates);
                    addSensorReading(seg.num_of_node, 'hum', hum);
                }
                break;
            }
            case CMD.GPIO_STATE: 
            case CMD.BTN_INPUT: 
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
                const currentSegments = useSegments.getState().segments;
                const regSegments = currentSegments.filter(s => s.gpio === msg.seg && s.groupType === 'register');
                
                regSegments.forEach(s => {
                    if (s.regBitIndex !== undefined) {
                        const isOn = ((msg.val >> s.regBitIndex) & 1) === 1;
                        const updates = { is_led_on: isOn ? 'on' : 'off' } as const;
                        
                        queryClient.setQueryData(['device', s.num_of_node], (old: Segment | undefined) => 
                            old ? { ...old, ...updates } : undefined
                        );
                        useSegments.getState().updateSegment(s.num_of_node, updates);
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
      console.error(errorMessage);
    }

    return () => {
      activeSubscribers--;
      if (activeSubscribers === 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
    };
  }, [settings.domain, settings.useSsl, setConnected, addLog, addToast, queryClient, addSensorReading]);

  const sendCommand = (cmd: number, gpio: number, value: number): boolean => {
    // Capture the current socket instance to a local variable to prevent race conditions
    // where sharedSocket might become null (cleanup) between check and usage.
    const socket = sharedSocket;
    
    if (!socket) return false;

    const buffer = protocolRef.current.encode(cmd, gpio, value);
    const success = socket.send(buffer);
    
    if (success) {
      const hex = Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      addLog('out', hex, `CMD:${cmd} GPIO:${gpio} VAL:${value}`);
    }
    return success;
  };

  return { sendCommand };
}
