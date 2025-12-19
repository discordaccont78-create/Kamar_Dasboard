
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
import { Zap, Trash2, Hexagon, Cpu } from 'lucide-react';

export const MUSIC_TRACKS = [
  { id: 0, title: "CYBERPUNK AMBIENT", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: 1, title: "DATA STREAM LO-FI", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "SYNTHETIC NEURONS", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "HARDWARE ECHO", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const MotionDiv = motion.div as any;

const CoreEmblem = () => (
  <div className="relative flex items-center justify-center">
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute"
    >
      <Hexagon size={180} strokeWidth={0.5} className="text-primary/20" />
    </MotionDiv>
    <MotionDiv
      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="bg-card-light dark:bg-card-dark border-2 border-primary/50 p-6 rounded-full shadow-[0_0_40px_rgba(218,165,32,0.2)] z-10 transition-colors"
    >
      {/* Restored Zap Icon based on user request */}
      <Zap size={48} className="text-primary" fill="currentColor" />
    </MotionDiv>
  </div>
);

export default function DashboardPage() {
  const { segments, setSegments, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings } = useSettingsStore();
  const { addToast } = useConnection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sendCommand } = useWebSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    const handlePlayback = async () => {
      if (!settings.bgMusic) {
        audioRef.current?.pause();
        return;
      }
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
      }
      const track = MUSIC_TRACKS[settings.currentTrackIndex];
      try {
        audioRef.current.src = track.url;
        audioRef.current.volume = settings.volume / 100;
        await audioRef.current.play();
      } catch (e) {}
    };
    handlePlayback();
  }, [settings.bgMusic, settings.currentTrackIndex, settings.volume]);

  const groupedSegments = useMemo(() => {
    const groups: Record<string, Segment[]> = {};
    segments.forEach((seg) => {
      const groupName = seg.group || "basic"; 
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(seg);
    });
    return groups;
  }, [segments]);

  const groupEntries = Object.entries(groupedSegments);
  const totalGroups = groupEntries.length;

  // Logic to calculate layout span (same as Segment logic)
  const getGroupSpan = (index: number) => {
    if (totalGroups === 1) return "col-span-1 md:col-span-2";
    if (totalGroups % 2 !== 0 && index === totalGroups - 1) return "col-span-1 md:col-span-2";
    return "col-span-1";
  };

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-500 flex flex-col overflow-x-hidden">
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-6 pt-12 flex-1 pb-40 w-full relative">
          {segments.length === 0 ? (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 min-h-[60vh]">
              <MotionDiv onClick={() => setIsMenuOpen(true)} className="relative z-20 cursor-pointer flex flex-col items-center gap-8">
                <CoreEmblem />
                <div className="text-center max-w-2xl px-8">
                  <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-primary">Hardware Intelligence</h2>
                  <div className="h-0.5 w-32 bg-primary mx-auto opacity-40 my-4" />
                  <p className="text-sm font-bold text-gray-500 italic leading-relaxed uppercase tracking-[0.1em] mb-6">
                    "Success at anything will always come down to this: <br/>
                    <span className="text-[#1A1C1E] dark:text-[#E0E0E0] not-italic border-b-2 border-primary transition-colors">Focus and effort.</span> And we control both."
                  </p>
                </div>
                <button className="bg-card-light dark:bg-card-dark text-primary border-2 border-primary/40 px-10 py-4 rounded-chip font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-black transition-all duration-300 shadow-xl">
                  <span className="flex items-center gap-2"><Zap size={14} /> Initialize Deployment</span>
                </button>
              </MotionDiv>
            </MotionDiv>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {groupEntries.map(([groupName, groupNodes], index) => (
                <div key={groupName} className={`${getGroupSpan(index)}`}>
                  <SegmentGroup 
                    name={groupName}
                    segments={groupNodes}
                    onReorder={(newNodes) => {
                      const otherGroupsSegments = segments.filter(s => (s.group || "basic") !== groupName);
                      setSegments([...otherGroupsSegments, ...newNodes]);
                    }}
                    onRemove={removeSegment}
                    onToggle={(id) => {
                      toggleSegment(id);
                      const seg = segments.find(s => s.num_of_node === id);
                      if (seg) sendCommand(seg.is_led_on === 'on' ? CMD.LED_OFF : CMD.LED_ON, seg.gpio || 0, 0);
                    }}
                    onPWMChange={setPWM}
                    onToggleBit={() => {}}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-card-light dark:bg-card-dark text-[#1A1C1E] dark:text-[#E0E0E0] border-t-2 border-primary/20 py-4 px-10 z-[100] flex items-center justify-between h-20 transition-colors duration-500 shadow-2xl">
          <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.2em] text-primary">
            <Cpu size={14} /> 
            <span className="opacity-60">ESP32-NODE-PRO</span>
          </div>

          <AnimatePresence>
            {isDragging && (
              <MotionDiv 
                initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                className="absolute inset-0 flex items-center justify-center bg-red-600/90 text-white font-black uppercase tracking-[0.3em] gap-3 z-50 pointer-events-none"
              >
                <Trash2 size={20} /> <span className="text-[10px]">Release to Delete Module</span>
              </MotionDiv>
            )}
          </AnimatePresence>

          <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20">Secure Link V3.1</div>
        </footer>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
