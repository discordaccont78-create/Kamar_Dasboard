
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MotionConfig } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { Console } from '../components/UI/Console';
import { ToastContainer } from '../components/UI/Toast';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { CMD, Segment } from '../types/index';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bot, Cpu, Zap, Network, LayoutGrid } from 'lucide-react';

export default function DashboardPage() {
  const { segments, setSegments, updateSegment, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings } = useSettingsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sendCommand } = useWebSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('no-animations', !settings.animations);
  }, [settings.theme, settings.animations]);

  // Audio Engine Management
  useEffect(() => {
    if (settings.bgMusic) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.play().catch(() => {
        console.info("Ambient stream blocked - interaction needed");
      });
    } else {
      audioRef.current?.pause();
    }
  }, [settings.bgMusic, settings.volume]);

  // Grouping logic for logical buckets
  const groupedSegments = useMemo(() => {
    return segments.reduce((acc, seg) => {
      const groupName = "Active Modules"; 
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(seg);
      return acc;
    }, {} as Record<string, Segment[]>);
  }, [segments]);

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
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-500 pb-32">
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-6 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16 items-start">
            {segments.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-40 gap-10 border-4 border-dashed border-gray-300 dark:border-white/5 rounded-[60px] opacity-30 group hover:opacity-100 transition-all cursor-pointer" onClick={() => setIsMenuOpen(true)}>
                <div className="bg-gray-100 dark:bg-white/5 p-12 rounded-full relative">
                  <Bot size={80} className="text-gray-400" />
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                </div>
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-black uppercase text-black dark:text-white tracking-tighter">System Idle</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.5em] max-w-xs mx-auto leading-relaxed">
                    No active IO modules detected. Deployment required.
                  </p>
                </div>
                <button className="px-10 py-4 bg-black text-primary font-black uppercase text-[11px] tracking-widest rounded-2xl border border-primary/20 hover:scale-105 transition-transform">
                  Configure Node OS
                </button>
              </div>
            ) : (
              Object.entries(groupedSegments).map(([groupName, groupNodes]) => (
                <SegmentGroup 
                  key={groupName}
                  name={groupName}
                  segments={groupNodes}
                  onReorder={setSegments}
                  onRemove={removeSegment}
                  onToggle={handleToggle}
                  onPWMChange={handlePWMChange}
                  onToggleBit={handleToggleBit}
                />
              ))
            )}
          </div>
          
          {/* Real-time Telemetry Monitor */}
          <div className="mt-20">
            <Console />
          </div>

          {/* System Metadata Footer */}
          <div className="mt-24 pt-10 border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-10 justify-center opacity-30">
            <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-widest">
              <Cpu size={14} className="text-primary" /> ESP32-S3 CORE
            </div>
            <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-widest">
              <Network size={14} className="text-primary" /> BINARY-V3 STREAM
            </div>
            <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-widest">
              <LayoutGrid size={14} className="text-primary" /> DYNAMIC-ALIASING
            </div>
          </div>
        </main>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
        
        {/* Dynamic Background elements */}
        <div className="fixed top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[150px] pointer-events-none z-[-1]" />
        <div className="fixed bottom-0 left-0 w-1/4 h-1/4 bg-primary/5 blur-[120px] pointer-events-none z-[-1]" />
      </div>
    </MotionConfig>
  );
}
