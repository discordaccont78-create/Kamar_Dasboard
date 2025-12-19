
import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { Console } from '../components/UI/Console';
import { ToastContainer } from '../components/UI/Toast';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useConnection } from '../lib/store/connection';
import { CMD, Segment } from '../types/index';
import { BinaryProtocol } from '../lib/connection/protocol';
import { WebSocketManager } from '../lib/connection/websocket';
import { Bot } from 'lucide-react';

export default function DashboardPage() {
  const { segments, setSegments, updateSegment, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings } = useSettingsStore();
  const { setConnected, addLog, addToast } = useConnection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const wsRef = useRef<WebSocketManager | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const protocolRef = useRef(new BinaryProtocol());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    if (settings.bgMusic) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [settings.bgMusic, settings.volume]);

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
          handleIncomingMessage(msg);
        }
      }
    });
    
    try {
      wsRef.current.connect();
    } catch (err: any) {
      addToast(`Security Error: ${err.message}`, "error");
    }

    return () => wsRef.current?.disconnect();
  }, [settings.domain, settings.useSsl, setConnected, addLog, addToast]);

  const handleIncomingMessage = (msg: { cmd: number, seg: number, val: number }) => {
    const seg = segments.find(s => s.gpio === msg.seg);
    if (!seg) return;
    switch (msg.cmd) {
      case CMD.LED_ON: updateSegment(seg.num_of_node, { is_led_on: 'on' }); break;
      case CMD.LED_OFF: updateSegment(seg.num_of_node, { is_led_on: 'off' }); break;
      case CMD.LED_PWM: updateSegment(seg.num_of_node, { val_of_slide: msg.val }); break;
      case CMD.TEMP_DATA: updateSegment(seg.num_of_node, { temperature: msg.val / 10 }); break;
      case CMD.HUM_DATA: updateSegment(seg.num_of_node, { humidity: msg.val / 10 }); break;
      case CMD.GPIO_STATE: updateSegment(seg.num_of_node, { inputActive: msg.val === 1 }); break;
      case CMD.SR_STATE: updateSegment(seg.num_of_node, { val_of_slide: msg.val }); break;
    }
  };

  const sendCommand = (cmd: CMD, gpio: number, value: number) => {
    const buffer = protocolRef.current.encode(cmd, gpio, value);
    if (wsRef.current?.send(buffer)) {
      const hex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      addLog('out', hex, `CMD:${cmd} GPIO:${gpio} VAL:${value}`);
    } else {
      addToast("Failed: Device Offline", "error");
    }
  };

  const handleToggle = (id: string) => {
    const seg = segments.find(s => s.num_of_node === id);
    if (!seg) return;
    toggleSegment(id);
    const newState = seg.is_led_on === 'on' ? 'off' : 'on';
    sendCommand(newState === 'on' ? CMD.LED_ON : CMD.LED_OFF, seg.gpio || 0, 0);
  };

  const handlePWMChange = (id: string, val: number) => {
    const seg = segments.find(s => s.num_of_node === id);
    if (!seg) return;
    setPWM(id, val);
    sendCommand(CMD.LED_PWM, seg.gpio || 0, val);
  };

  const handleToggleBit = (id: string, bit: number) => {
    const seg = segments.find(s => s.num_of_node === id);
    if (!seg) return;
    const bitState = (seg.val_of_slide >> bit) & 1;
    const newVal = bitState ? (seg.val_of_slide & ~(1 << bit)) : (seg.val_of_slide | (1 << bit));
    updateSegment(id, { val_of_slide: newVal });
    sendCommand(CMD.SR_PIN, seg.gpio || 0, bit | ((bitState ? 0 : 1) << 8));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#121212] transition-colors duration-500 pb-20">
      <Header onOpenMenu={() => setIsMenuOpen(true)} />
      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {segments.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 gap-8 border-4 border-dashed border-gray-300 dark:border-[#333] rounded-[50px] opacity-30">
              <Bot size={100} className="text-gray-400" />
              <h2 className="text-2xl font-black uppercase text-center">Dashboard Empty</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center max-w-xs">
                Open settings to assign your first hardware node and GPIO controller.
              </p>
            </div>
          ) : (
            <SegmentGroup 
              segments={segments}
              onReorder={setSegments}
              onRemove={removeSegment}
              onToggle={handleToggle}
              onPWMChange={handlePWMChange}
              onToggleBit={handleToggleBit}
            />
          )}
        </div>
        <Console />
      </main>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <ToastContainer />
    </div>
  );
}
