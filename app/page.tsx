
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { ToastContainer } from '../components/UI/Toast';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useConnection } from '../lib/store/connection';
import { CMD, Segment } from '../types/index';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bot, Cpu, Zap, Trash2 } from 'lucide-react';

export const MUSIC_TRACKS = [
  { id: 0, title: "CYBERPUNK AMBIENT", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: 1, title: "DATA STREAM LO-FI", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "SYNTHETIC NEURONS", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "HARDWARE ECHO", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const CACHE_NAME = 'iot-dashboard-audio-v1';

const MotionDiv = motion.div as any;

export default function DashboardPage() {
  const { segments, setSegments, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings } = useSettingsStore();
  const { addToast } = useConnection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { sendCommand } = useWebSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('no-animations', !settings.animations);
  }, [settings.theme, settings.animations]);

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
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
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
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, [settings.bgMusic, settings.currentTrackIndex, settings.volume, addToast]);

  const groupedSegments = useMemo(() => {
    const groups: Record<string, Segment[]> = {};
    segments.forEach((seg) => {
      const groupName = seg.group || "Main Group"; 
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(seg);
    });
    return groups;
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
    useSegments.getState().updateSegment(id, { val_of_slide: newVal });
    sendCommand(CMD.SR_PIN, seg.gpio || 0, bit | ((bitState ? 0 : 1) << 8));
  };

  const handleReorderInGroup = (groupName: string, newGroupSegments: Segment[]) => {
    // بازسازی کل لیست سگمنت‌ها با حفظ ترتیب گروه‌های دیگر
    const otherGroupsSegments = segments.filter(s => s.group !== groupName);
    // برای حفظ ثبات بصری، سگمنت‌های گروه فعلی را در جای قبلی خود جایگزین می‌کنیم
    const updatedSegments = [...otherGroupsSegments, ...newGroupSegments];
    setSegments(updatedSegments);
  };

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-500 flex flex-col overflow-x-hidden">
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
                <MotionDiv 
                  key={groupName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <SegmentGroup 
                    name={groupName}
                    segments={groupNodes as Segment[]}
                    onReorder={(newNodes) => handleReorderInGroup(groupName, newNodes)}
                    onRemove={(id) => {
                      removeSegment(id);
                      addToast("Module Terminated & Decoupled", "error");
                    }}
                    onToggle={handleToggle}
                    onPWMChange={handlePWMChange}
                    onToggleBit={handleToggleBit}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                </MotionDiv>
              ))}
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-black border-t-4 border-primary/30 py-6 px-10 z-[100] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] h-24 overflow-hidden">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-primary/90">
              <Cpu size={16} /> 
              <span>Node: ESP32-PRO</span>
            </div>
          </div>

          <AnimatePresence>
            {isDragging && (
              <MotionDiv 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute inset-0 flex items-center justify-center bg-red-600/95 backdrop-blur-md text-white font-black uppercase tracking-[0.4em] gap-4 z-50 pointer-events-none"
              >
                <Trash2 size={28} className="animate-bounce" />
                <span className="text-sm">🗑️ Drop to Delete Module</span>
              </MotionDiv>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
              SECURE LINK ESTABLISHED
            </div>
          </div>
        </footer>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
