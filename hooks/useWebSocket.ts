
'use client';

import { useEffect, useRef } from 'react';
import { WebSocketManager } from '../lib/connection/websocket';
import { BinaryProtocol } from '../lib/connection/protocol';
import { useConnection } from '../lib/store/connection';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { CMD } from '../types/index';

export function useWebSocket() {
  const wsRef = useRef<WebSocketManager | null>(null);
  const protocolRef = useRef(new BinaryProtocol());
  const { setConnected, addLog, addToast } = useConnection();
  const { updateSegment } = useSegments();
  const { settings } = useSettingsStore();

  useEffect(() => {
    const cleanDomain = settings.domain.replace(/^(ws|wss):\/\//, '').trim();
    if (!cleanDomain) return;

    const protocol = settings.useSsl ? 'wss' : 'ws';
    const url = `${protocol}://${cleanDomain}.local/ws`;

    wsRef.current = new WebSocketManager(url);
    wsRef.current.onStatus(setConnected);
    wsRef.current.onMessage((data) => {
      if (data instanceof ArrayBuffer) {
        const msg = protocolRef.current.decode(data);
        if (msg) {
          const hex = Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          addLog('in', hex, `CMD:${msg.cmd} SEG:${msg.seg} VAL:${msg.val}`);
          
          // Use getState to avoid re-triggering effect on every state change
          const currentSegments = useSegments.getState().segments;
          const seg = currentSegments.find(s => s.gpio === msg.seg);
          
          if (seg) {
            switch (msg.cmd) {
              case CMD.LED_ON: updateSegment(seg.num_of_node, { is_led_on: 'on' }); break;
              case CMD.LED_OFF: updateSegment(seg.num_of_node, { is_led_on: 'off' }); break;
              case CMD.LED_PWM: updateSegment(seg.num_of_node, { val_of_slide: msg.val }); break;
              case CMD.TEMP_DATA: updateSegment(seg.num_of_node, { temperature: msg.val / 10 }); break;
              case CMD.HUM_DATA: updateSegment(seg.num_of_node, { humidity: msg.val / 10 }); break;
              case CMD.GPIO_STATE: updateSegment(seg.num_of_node, { inputActive: msg.val === 1 }); break;
              case CMD.SR_STATE: updateSegment(seg.num_of_node, { val_of_slide: msg.val }); break;
            }
          }
        }
      }
    });

    try {
      wsRef.current.connect();
    } catch (err: any) {
      addToast(`Security Error: ${err.message}`, "error");
    }

    return () => {
      wsRef.current?.disconnect();
    };
  }, [settings.domain, settings.useSsl, setConnected, addLog, addToast, updateSegment]);

  const sendCommand = (cmd: number, gpio: number, value: number) => {
    const buffer = protocolRef.current.encode(cmd, gpio, value);
    const success = wsRef.current?.send(buffer) || false;
    if (success) {
      const hex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      addLog('out', hex, `CMD:${cmd} GPIO:${gpio} VAL:${value}`);
    } else {
      addToast("Failed: Device Offline", "error");
    }
    return success;
  };

  return { sendCommand };
}
