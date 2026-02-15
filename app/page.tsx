
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { DraggableGroupItem } from '../components/Group/DraggableGroupItem';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useAudioStore } from '../lib/store/audioStore'; 
import { useUIStore } from '../lib/store/uiState'; 
import { useSchedulerEngine } from '../hooks/useSchedulerEngine';
import { Zap, Trash2, Cpu, Laptop, Smartphone, Tablet } from 'lucide-react';
import { cn, getFontClass } from '../lib/utils';
import { translations } from '../lib/i18n';
import { MUSIC_TRACKS } from '../lib/constants';
import { CoreEmblem } from '../components/Effects/CoreEmblem';
import { Segment, GroupConfig } from '../types/index';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

// Helper: Convert Hex to HSL
function hexToHSL(H: string) {
  let r = 0, g = 0, b = 0;
  if (H.length == 4) {
    r = parseInt("0x" + H[1] + H[1]);
    g = parseInt("0x" + H[2] + H[2]);
    b = parseInt("0x" + H[3] + H[3]);
  } else if (H.length == 7) {
    r = parseInt("0x" + H[1] + H[2]);
    g = parseInt("0x" + H[3] + H[4]);
    b = parseInt("0x" + H[5] + H[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

export default function DashboardPage(): React.JSX.Element {
  const { segments, groups, removeSegment, removeGroup, toggleSegment, setPWM, reorderGroups, addGroup } = useSegments();
  const { removeSchedulesByTarget } = useSchedulerStore(); 
  const { settings } = useSettingsStore();
  const { setAudioState, seekRequest, clearSeekRequest } = useAudioStore(); 
  const { setOutputForm, setActiveSection } = useUIStore(); 
  
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [dragType, setDragType] = useState<'none' | 'group' | 'segment'>('none');
  const isDragging = dragType !== 'none';

  const [deviceInfo, setDeviceInfo] = useState<{ label: string, icon: 'desktop' | 'mobile' | 'tablet' }>({ 
      label: "ANALYZING...", 
      icon: 'desktop' 
  });
  
  useSchedulerEngine();
  
  const groupsContainerRef = useRef<HTMLDivElement>(null);
  const lastGroupReorderTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[settings.language];

  // Drag Handlers
  const handleGroupDragStart = useCallback(() => setDragType('group'), []);
  const handleSegmentDragStart = useCallback(() => setDragType('segment'), []);
  const handleDragEnd = useCallback(() => setDragType('none'), []);

  // Quick Add Handler
  const handleQuickAdd = useCallback((groupName: string, replaceId?: string) => {
      setOutputForm({ group: groupName, replaceId: replaceId });
      setActiveSection('output');
      setIsMenuOpen(true);
  }, [setOutputForm, setActiveSection]);

  const handleRemoveSegment = useCallback((id: string) => {
    removeSchedulesByTarget(id);
    removeSegment(id);
  }, [removeSchedulesByTarget, removeSegment]);

  const handleRemoveGroup = useCallback((groupName: string) => {
    const targetIds = segments.filter(s => (s.groupId || "basic") === groupName).map(s => s.num_of_node);
    targetIds.forEach(id => removeSchedulesByTarget(id));
    removeGroup(groupName);
  }, [segments, removeSchedulesByTarget, removeGroup]);

  useEffect(() => {
    const hsl = hexToHSL(settings.primaryColor);
    document.documentElement.style.setProperty('--primary', hsl);
  }, [settings.primaryColor]);
  
  useEffect(() => {
    document.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [settings.language]);

  // Device & OS Detection
  useEffect(() => {
    const detectDevice = () => {
        const ua = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        const isTouch = navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;

        let os = "WEB";
        let icon: 'desktop' | 'mobile' | 'tablet' = 'desktop';

        if (ua.includes("android")) {
            os = "ANDROID";
        } else if (ua.includes("iphone") || ua.includes("ipod")) {
            os = "IOS";
        } else if (ua.includes("ipad")) {
            os = "IPADOS";
        } else if (ua.includes("mac")) {
            os = isTouch ? "IPADOS" : "MACOS";
        } else if (ua.includes("win")) {
            os = "WIN";
        } else if (ua.includes("linux")) {
            os = "LINUX";
        }

        if (os === "ANDROID" || os === "IOS" || os === "IPADOS") {
            if (os === "IPADOS" || (os === "ANDROID" && !ua.includes("mobile")) || width > 600) {
                 icon = width > 900 ? 'desktop' : 'tablet'; 
                 if(width < 900) icon = 'tablet';
            } else {
                 icon = 'mobile';
            }
        } else {
            if (isTouch && width < 900) {
                icon = width < 600 ? 'mobile' : 'tablet';
            } else {
                icon = 'desktop';
            }
        }

        setDeviceInfo({ 
            label: `${os} ${icon.toUpperCase()}`, 
            icon 
        });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = settings.volume / 100;
    }
  }, [settings.volume]);

  useEffect(() => {
    if (seekRequest !== null && audioRef.current) {
      if (Number.isFinite(seekRequest)) {
        audioRef.current.currentTime = seekRequest;
      }
      clearSeekRequest();
    }
  }, [seekRequest, clearSeekRequest]);

  useEffect(() => {
    const handlePlayback = async () => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        
        audioRef.current.ontimeupdate = () => {
            const el = audioRef.current;
            if (el) setAudioState(el.currentTime, el.duration, !el.paused);
        };
        audioRef.current.onloadedmetadata = () => {
            const el = audioRef.current;
            if (el) setAudioState(el.currentTime, el.duration, !el.paused);
        };
        audioRef.current.onplay = () => {
             const el = audioRef.current;
             if (el) setAudioState(el.currentTime, el.duration, true);
        };
        audioRef.current.onpause = () => {
             const el = audioRef.current;
             if (el) setAudioState(el.currentTime, el.duration, false);
        };
      }

      const audio = audioRef.current;

      if (!settings.bgMusic) {
        if (!audio.paused) audio.pause();
        return;
      }

      const track = MUSIC_TRACKS[settings.currentTrackIndex];
      if (!track) return;

      const targetSrc = track.url;
      const currentSrc = decodeURIComponent(audio.src).split('?')[0]; 
      const targetSrcDecoded = decodeURIComponent(targetSrc).split('?')[0];

      const needsLoad = audio.src === '' || (currentSrc !== targetSrcDecoded && !currentSrc.endsWith(targetSrcDecoded));

      try {
        if (needsLoad) {
            audio.src = targetSrc;
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                        console.warn("Audio Play Error:", error);
                    }
                });
            }
        } else {
            if (audio.paused) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            }
        }
        audio.volume = settings.volume / 100;
      } catch (e: unknown) {
          console.warn("Audio Engine Exception:", e);
      }
    };
    void handlePlayback();
  }, [settings.bgMusic, settings.currentTrackIndex, setAudioState]);

  useEffect(() => {
      const unlockAudio = () => {
          if (settings.bgMusic && audioRef.current && audioRef.current.paused) {
              audioRef.current.play().catch(() => {});
          }
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
      };
      document.addEventListener('click', unlockAudio);
      document.addEventListener('keydown', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
      return () => {
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
      };
  }, [settings.bgMusic]);

  // --- LOGIC CHANGE: Groups are Source of Truth ---
  // Ensure we display all defined groups (including spacers) + any groups implicitly defined by segments
  const displayGroups = useMemo(() => {
      // 1. Start with defined groups from store (sorted by order)
      const allGroups = [...groups];
      const definedIds = new Set(groups.map(g => g.id));

      // 2. Scan segments for implicit groups
      segments.forEach(seg => {
          const gId = seg.groupId || "basic";
          if (!definedIds.has(gId)) {
              // Implicit group found, create a temp config and add it
              allGroups.push({
                  id: gId,
                  name: gId,
                  order: allGroups.length, // Append to end
                  columnCount: 2
              });
              definedIds.add(gId);
          }
      });

      return allGroups.sort((a,b) => a.order - b.order);
  }, [groups, segments]);

  const groupedSegments = useMemo(() => {
    const groupsMap: Record<string, Segment[]> = {};
    segments.forEach((seg) => {
      const groupName = seg.groupId || "basic"; 
      if (!groupsMap[groupName]) groupsMap[groupName] = [];
      groupsMap[groupName].push(seg);
    });
    return groupsMap;
  }, [segments]);

  const moveGroup = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...displayGroups];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    
    // Update order property
    const finalOrder = newOrder.map((g, idx) => ({ ...g, order: idx }));
    reorderGroups(finalOrder);
  }, [displayGroups, reorderGroups]);

  const bgClass = useMemo(() => {
    if (settings.backgroundEffect === 'grid') return 'graph-paper';
    return 'pattern-bg';
  }, [settings.backgroundEffect]);

  const groupCols = settings.groupColumnCount || 2;
  const mainGridClass = useMemo(() => {
      if (groupCols === 1) return "grid-cols-1 gap-4 md:gap-8";
      if (groupCols === 2) return "grid-cols-1 md:grid-cols-2 gap-4 md:gap-8";
      if (groupCols === 3) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8";
      return "grid-cols-1 md:grid-cols-2 gap-4 md:gap-8";
  }, [groupCols]);

  const CLIP_FOOTER_LEFT = "polygon(0 12px, 12px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";
  const CLIP_FOOTER_RIGHT = "polygon(20px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";
  const CLIP_BRIDGE = "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";
  const activeAccent = settings.cursorColor || '#daa520';

  const footerVariants = {
    hidden: { y: 50, opacity: 0 },
    locked: { 
        y: 0, 
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    floatLeft: { 
        y: [0, -4, 1, -2, 0], 
        x: [0, 1, -1, 0],
        opacity: 1,
        transition: { 
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
    },
    floatRight: { 
        y: [0, 2, -1, 2, 0], 
        x: [0, -2, 1, -1, 0],
        opacity: 1,
        transition: { 
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
    }
  };

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className={cn(
          "min-h-screen transition-colors duration-500 flex flex-col overflow-x-hidden bg-background text-foreground",
          bgClass,
          settings.animations && "animate-grid",
          getFontClass(settings.dashboardFont) 
      )}>
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-[1400px] mx-auto px-3 md:px-6 pt-6 md:pt-12 flex-1 pb-32 md:pb-40 w-full relative">
          {displayGroups.length === 0 ? (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 md:py-16 min-h-[60vh]">
              <MotionDiv onClick={() => setIsMenuOpen(true)} className="relative z-20 cursor-pointer flex flex-col items-center gap-8 md:gap-10">
                <CoreEmblem />
                <div className="text-center max-w-xs md:max-w-2xl px-4 md:px-8 space-y-4">
                  <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary drop-shadow-md">
                    THE MOST ELECTRIFYING <br />
                    <span className="text-foreground/80 text-lg md:text-2xl tracking-[0.4em]">IOT EXPERIENCE</span>
                  </h2>
                  <div className="h-0.5 w-24 md:w-40 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-60 my-4" />
                  <p className="text-xs md:text-sm font-bold text-muted-foreground italic leading-relaxed uppercase tracking-[0.1em] mb-4 md:mb-6">
                    "{t.success_msg} <br/>
                    <span className="text-foreground not-italic border-b-2 border-primary transition-colors">{t.focus_effort}</span> {t.we_control}"
                  </p>
                </div>
                <button className="bg-background text-primary border-2 border-primary/50 px-8 py-4 md:px-12 md:py-5 rounded-bevel font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] hover:shadow-[0_0_40px_-5px_rgba(var(--primary),0.8)] active:scale-95">
                  <span className="flex items-center gap-3"><Zap size={16} fill="currentColor" /> {t.init_deploy}</span>
                </button>
              </MotionDiv>
            </MotionDiv>
          ) : (
            <div 
              ref={groupsContainerRef}
              className={cn("grid relative", mainGridClass)}
            >
              <AnimatePresence mode="popLayout">
                {displayGroups.map((groupConfig, index) => {
                   // Ensure we get segments for this group, or empty array
                   const groupNodes = groupedSegments[groupConfig.id] || [];
                   const spanClass = "col-span-1";

                   return (
                     <DraggableGroupItem
                       key={groupConfig.id}
                       groupName={groupConfig.id}
                       groupNodes={groupNodes}
                       index={index}
                       containerRef={groupsContainerRef}
                       moveGroup={moveGroup}
                       removeSegment={handleRemoveSegment}
                       removeGroup={handleRemoveGroup}
                       toggleSegment={toggleSegment}
                       setPWM={setPWM}
                       lastReorderTime={lastGroupReorderTime}
                       className={spanClass}
                       onDragStart={handleGroupDragStart}
                       onDragEnd={handleDragEnd}
                       onSegmentDragStart={handleSegmentDragStart}
                       onSegmentDragEnd={handleDragEnd}
                       onAddSegment={handleQuickAdd}
                     />
                   );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="fixed bottom-3 md:bottom-6 left-0 w-full px-2 md:px-8 z-[40] pointer-events-none">
          <div className={cn(
              "max-w-[1400px] mx-auto flex items-end justify-between relative h-12 md:h-14 transition-all duration-300",
              isDragging ? "gap-0" : "gap-2 md:gap-4" 
          )}>
            
            <MotionDiv 
              layout
              variants={footerVariants}
              initial="hidden"
              animate={isDragging ? "locked" : (settings.floatingIslands ?? true ? "floatLeft" : "locked")} 
              className="relative h-full min-w-[140px] md:min-w-[200px] pointer-events-auto filter drop-shadow-lg z-20 shrink-0"
            >
               <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md" style={{ clipPath: CLIP_FOOTER_LEFT }} />
               <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-xl flex items-center px-4 md:px-6" style={{ clipPath: CLIP_FOOTER_LEFT }}>
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <Cpu className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-foreground/90 leading-none">ESP32-NODE</span>
                          <span className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Core Active</span>
                      </div>
                  </div>
               </div>
            </MotionDiv>

            <AnimatePresence mode="wait">
              {isDragging && (
                <MotionDiv 
                  layout
                  initial={{ opacity: 0, scaleY: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scaleY: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scaleY: 0, filter: 'blur(10px)' }}
                  originY={1}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex-1 h-full relative z-30 pointer-events-auto flex items-center justify-center group mx-[-2px]" 
                >
                   <div 
                      className="absolute inset-0 backdrop-blur-md transition-all group-hover:opacity-100 opacity-50" 
                      style={{ 
                          clipPath: CLIP_BRIDGE,
                          backgroundColor: activeAccent 
                      }}
                   />
                   
                   <div 
                      className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 flex items-center justify-center overflow-hidden" 
                      style={{ clipPath: CLIP_BRIDGE }}
                   >
                        <div 
                            className="absolute inset-0 opacity-10" 
                            style={{ 
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${activeAccent} 10px, ${activeAccent} 20px)`,
                                backgroundSize: '200% 200%'
                            }}
                        />
                        
                        <div 
                            className="relative z-10 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            style={{ color: activeAccent }}
                        >
                            <Trash2 className="w-5 h-5 md:w-6 md:h-6 animate-bounce" strokeWidth={2.5} />
                            <span className="font-black text-xs md:text-sm uppercase tracking-[0.25em]">
                                {dragType === 'group' ? t.release_delete_group : (dragType === 'segment' ? t.release_delete_segment : t.release_delete)}
                            </span>
                        </div>
                   </div>
                </MotionDiv>
              )}
            </AnimatePresence>

            <MotionDiv 
              layout
              variants={footerVariants}
              initial="hidden"
              animate={isDragging ? "locked" : (settings.floatingIslands ?? true ? "floatRight" : "locked")}
              className="relative h-full min-w-[140px] md:min-w-[200px] pointer-events-auto filter drop-shadow-lg flex justify-end z-20 shrink-0"
            >
               <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md" style={{ clipPath: CLIP_FOOTER_RIGHT }} />
               <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-xl flex items-center justify-end px-4 md:px-6" style={{ clipPath: CLIP_FOOTER_RIGHT }}>
                  <div className="flex flex-col items-end gap-0.5">
                      <div 
                        className="flex items-center gap-1.5 transition-colors duration-300" 
                        style={{ color: settings.cursorColor || '#daa520' }}
                      >
                          {deviceInfo.icon === 'mobile' && <Smartphone size={10} />}
                          {deviceInfo.icon === 'tablet' && <Tablet size={10} />}
                          {deviceInfo.icon === 'desktop' && <Laptop size={10} />}
                          <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{deviceInfo.label}</span>
                      </div>
                      <div className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          SECURE LINK V3.1
                      </div>
                  </div>
               </div>
            </MotionDiv>

          </div>
        </footer>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </MotionConfig>
  );
}
