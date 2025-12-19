
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { Console } from '../components/UI/Console';
import { ToastContainer } from '../components/UI/Toast';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useConnection } from '../lib/store/connection';
import { CMD, Segment } from '../types/index';
import { useWebSocket } from '../hooks/useWebSocket';
// Fix: Added missing Zap icon import from lucide-react to resolve the reference error on line 184
import { Bot, Cpu, Terminal, Trash2, Zap } from 'lucide-react';

export const MUSIC_TRACKS = [
  { id: 0, title: "CYBERPUNK AMBIENT", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: 1, title: "DATA STREAM LO-FI", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "SYNTHETIC NEURONS", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "HARDWARE ECHO", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const CACHE_NAME = 'iot-dashboard-audio-v1';

export default function DashboardPage() {
  const { segments, setSegments, updateSegment, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings, updateSettings } = useSettingsStore();
  const { addToast } = useConnection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { sendCommand } = useWebSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('no-animations', !settings.animations);
  }, [settings.theme, settings.animations]);

  // Audio Caching and Playback Engine
  useEffect(() => {
    const handlePlayback = async () => {
      if (!settings.bgMusic) {
        audioRef.current?.pause();
        return;
      }

      const track = MUSIC_TRACKS[settings.currentTrackIndex];
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.loop = true;
        }

        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(track.url);

        if (!response) {
          addToast(`Caching Audio Asset...`, "info");
          response = await fetch(track.url);
          await cache.put(track.url, response.clone());
        }

        const blob = await response.blob();
        
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        
        const blobUrl = URL.createObjectURL(blob);
        objectUrlRef.current = blobUrl;

        audioRef.current.src = blobUrl;
        audioRef.current.volume = settings.volume / 100;
        await audioRef.current.play();
        
      } catch (error) {
        console.error("[AudioEngine] Playback Failed:", error);
      }
    };

    handlePlayback();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [settings.bgMusic, settings.currentTrackIndex, settings.volume, addToast]);

  // Grouping logic: Segments are grouped by their 'group' property
  const groupedSegments = useMemo(() => {
    return segments.reduce((acc, seg) => {
      const groupName = seg.group || "Main Group"; 
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
      <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-500 flex flex-col">
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-6 pt-12 flex-1 pb-40 w-full">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-10 border-4 border-dashed border-gray-300 dark:border-white/5 rounded-[60px] opacity-30 group hover:opacity-100 transition-all cursor-pointer" onClick={() => setIsMenuOpen(true)}>
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
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {Object.entries(groupedSegments).map(([groupName, groupNodes], groupIndex) => (
                <motion.div 
                  key={groupName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <SegmentGroup 
                    name={groupName}
                    segments={groupNodes}
                    onReorder={(newGroupSegments) => {
                        // Advanced reordering logic would go here if multi-group was strictly indexed
                        // For now, simpler reorder of the global segment list is used
                        const otherSegments = segments.filter(s => s.group !== groupName);
                        setSegments([...otherSegments, ...newGroupSegments]);
                    }}
                    onRemove={removeSegment}
                    onToggle={handleToggle}
                    onPWMChange={handlePWMChange}
                    onToggleBit={handleToggleBit}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-black border-t-4 border-primary/30 py-4 px-8 z-50 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary/80">
              <Cpu size={14} /> ESP32-PRO
            </div>
            <div className="hidden sm:flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary/60">
              <Zap size={14} className="text-primary animate-pulse" /> SYNC: ACTIVE
            </div>
          </div>

          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 -top-16 bg-red-600 text-white px-8 py-4 rounded-chip border-4 border-white shadow-2xl flex items-center gap-4 animate-pulse"
              >
                <Trash2 size={24} />
                <span className="font-black text-[11px] uppercase tracking-widest">Drop to Delete</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-chip border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                isConsoleOpen ? 'bg-primary text-black border-primary' : 'bg-white/5 text-primary border-primary/30'
              }`}
            >
              <Terminal size={14} /> Log Panel
            </button>
          </div>
        </footer>

        <AnimatePresence>
          {isConsoleOpen && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-[68px] left-0 w-full z-40"
            >
              <Console onClose={() => setIsConsoleOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
