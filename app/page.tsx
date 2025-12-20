
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
import { Zap, Trash2, Hexagon, Cpu, Laptop, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { translations } from '../lib/i18n';
import { MUSIC_TRACKS } from '../lib/constants';

// Workaround for Framer Motion types in this specific ESM environment
const MotionDiv = motion.div as any;

const CoreEmblem: React.FC = () => (
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
      className="bg-card-light dark:bg-card-dark border-2 border-primary/50 p-6 rounded-full shadow-[0_0_40px_rgba(var(--primary),0.2)] z-10 transition-colors"
    >
      <Zap size={48} className="text-primary" fill="currentColor" />
    </MotionDiv>
  </div>
);

export default function DashboardPage(): React.JSX.Element {
  const { segments, setSegments, removeSegment, toggleSegment, setPWM } = useSegments();
  const { settings } = useSettingsStore();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<string>("UNKNOWN");
  
  const t = translations[settings.language];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sendCommand } = useWebSocket();

  // Apply Primary Color Variable
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', settings.primaryColor);
  }, [settings.primaryColor]);
  
  // Apply RTL/LTR
  useEffect(() => {
    document.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [settings.language]);

  // Detect Device Type
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) {
      setDeviceType("MOBILE");
    } else {
      setDeviceType("DESKTOP");
    }
  }, []);

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
        if (audioRef.current.src !== track.url) {
            audioRef.current.src = track.url;
        }
        audioRef.current.volume = settings.volume / 100;
        await audioRef.current.play();
      } catch (e: unknown) {
        console.warn("Audio playback failed (likely user interaction required):", e);
      }
    };
    void handlePlayback();
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

  const getGroupSpan = (index: number): string => {
    if (totalGroups === 1) return "col-span-1 xl:col-span-2";
    if (totalGroups % 2 !== 0 && index === totalGroups - 1) return "col-span-1 xl:col-span-2";
    return "col-span-1";
  };

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className={cn(
          "min-h-screen graph-paper transition-colors duration-500 flex flex-col overflow-x-hidden",
          settings.animations && "animate-grid"
      )}>
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-6 pt-12 flex-1 pb-40 w-full relative">
          
          {segments.length === 0 ? (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 min-h-[60vh]">
              <MotionDiv onClick={() => setIsMenuOpen(true)} className="relative z-20 cursor-pointer flex flex-col items-center gap-8">
                <CoreEmblem />
                <div className="text-center max-w-2xl px-8">
                  <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-primary">{t.hardware_intel}</h2>
                  <div className="h-0.5 w-32 bg-primary mx-auto opacity-40 my-4" />
                  <p className="text-sm font-bold text-gray-500 italic leading-relaxed uppercase tracking-[0.1em] mb-6">
                    "{t.success_msg} <br/>
                    <span className="text-[#1A1C1E] dark:text-[#E0E0E0] not-italic border-b-2 border-primary transition-colors">{t.focus_effort}</span> {t.we_control}"
                  </p>
                </div>
                <button className="bg-card-light dark:bg-card-dark text-primary border-2 border-primary/40 px-10 py-4 rounded-chip font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-black transition-all duration-300 shadow-xl">
                  <span className="flex items-center gap-2"><Zap size={14} /> {t.init_deploy}</span>
                </button>
              </MotionDiv>
            </MotionDiv>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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

        <footer className="fixed bottom-4 left-0 w-full px-4 sm:px-6 z-[40] transition-colors duration-500">
          <div className="bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl py-4 px-10 flex items-center justify-between h-20 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.2em] text-primary">
              <Cpu size={14} /> 
              <span className="opacity-60">ESP32-NODE-PRO</span>
            </div>

            <AnimatePresence>
              {isDragging && (
                <MotionDiv 
                  initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                  className="absolute inset-0 flex items-center justify-center bg-red-600/90 text-white font-black uppercase tracking-[0.3em] gap-3 z-50 pointer-events-none rounded-2xl"
                >
                  <Trash2 size={20} /> <span className="text-[10px]">{t.release_delete}</span>
                </MotionDiv>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-end">
               <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Secure Link V3.1</div>
               <div className="text-[9px] font-bold text-primary mt-1 flex items-center gap-1.5 opacity-80">
                  {deviceType === 'MOBILE' ? <Smartphone size={10} /> : <Laptop size={10} />}
                  {t.footer_ver} = {deviceType} VER
               </div>
            </div>
          </div>
        </footer>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
