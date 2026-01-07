
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MotionConfig, AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useSchedulerStore } from '../lib/store/scheduler';
import { CMD, Segment } from '../types/index';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSchedulerEngine } from '../hooks/useSchedulerEngine';
import { Zap, Trash2, Cpu, Laptop, Smartphone, GripHorizontal } from 'lucide-react';
import { cn, getFontClass } from '../lib/utils';
import { translations } from '../lib/i18n';
import { MUSIC_TRACKS } from '../lib/constants';
import { LightningBolt } from '../components/Effects/LightningBolt';
import { useSoundFx } from '../hooks/useSoundFx';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

// --- CORE EMBLEM: SPORADIC DISCHARGE ---
const CoreDischarge = React.memo(() => {
  const [boltData, setBoltData] = useState<{ 
      id: number; 
      angle: number; 
      length: number; 
      thickness: number; 
      travelTime: number; 
      branchIntensity: number; 
      lingerDuration: number;
      fadeDuration: number; 
  } | null>(null);

  const [isActive, setIsActive] = useState(false);
  const { playLightning } = useSoundFx(); // Access Sound Engine

  useEffect(() => {
    let phase1Timeout: ReturnType<typeof setTimeout>;
    let phase2Timeout: ReturnType<typeof setTimeout>;
    let phase3Timeout: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      // 1. TIMING: Determine Delay before next bolt
      const isBurst = Math.random() < 0.3;
      const delayBeforeStart = isBurst 
        ? Math.random() * 800 + 300  
        : Math.random() * 3000 + 2000;

      phase1Timeout = setTimeout(() => {
        // 2. GENERATION: Create Bolt Data
        const angle = Math.random() * 360;
        const rawLen = Math.random();
        const length = 120 + (rawLen * rawLen * 480); 

        let thickness = 0.8;
        let branchIntensity = 0.5; // Default some branching
        let lingerDuration = 0.3; 
        let fadeDuration = 0.5;   

        if (length > 300) {
            // Big Bolt: Heavy, recursive branches, long linger
            thickness = 2.5;
            branchIntensity = 1.0 + Math.random(); // High intensity = more recursive depth
            lingerDuration = 0.5 + Math.random() * 1.0; 
            fadeDuration = 1.5 + Math.random();         
        } else if (length > 200) {
            // Medium Bolt
            thickness = 1.5;
            branchIntensity = 0.6 + Math.random() * 0.5;
            lingerDuration = 0.3 + Math.random() * 0.4;
            fadeDuration = 1.0 + Math.random() * 0.5;
        } else {
            // Small Bolt
            thickness = 1.0;
            branchIntensity = Math.random() > 0.4 ? 0.5 : 0; 
            lingerDuration = 0.1 + Math.random() * 0.2;
            fadeDuration = 0.6 + Math.random() * 0.4;
        }

        // STRIKE SPEED: Extremely fast (Flash)
        const travelTime = 0.05 + (length / 2000); 

        // 3. SOUND CALCULATION
        // Normalize length (approx 120 to 600) to 0-1 range
        const lenFactor = Math.min((length - 120) / 480, 1); 
        // Normalize branches (0 to ~2)
        const branchFactor = Math.min(branchIntensity / 2, 1);
        
        // Intensity is weighted average: Length matters more (70%), Branches (30%)
        const soundIntensity = (lenFactor * 0.7) + (branchFactor * 0.3);
        
        // Trigger Sound
        playLightning(soundIntensity);

        setBoltData({ 
            id: Date.now(), 
            angle, length, thickness, travelTime, branchIntensity, lingerDuration, fadeDuration 
        });
        setIsActive(true);

        // Keep it visible for Strike Time + a tiny bit of hold, then fade
        const visibleTime = (travelTime * 1000) + 100;
        
        phase2Timeout = setTimeout(() => {
            setIsActive(false);

            const fadeTimeMs = fadeDuration * 1000;
            phase3Timeout = setTimeout(() => {
                setBoltData(null);
                runCycle(); // Loop
            }, fadeTimeMs + 100); 

        }, visibleTime);

      }, delayBeforeStart);
    };

    runCycle();

    return () => {
      clearTimeout(phase1Timeout);
      clearTimeout(phase2Timeout);
      clearTimeout(phase3Timeout);
    };
  }, [playLightning]);

  if (!boltData) return <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-0" />;

  // Coordinate System
  const center = 400;
  const rad = (boltData.angle * Math.PI) / 180;
  const startOffset = 35; 
  const sx = center + startOffset * Math.cos(rad);
  const sy = center + startOffset * Math.sin(rad);
  const ex = center + boltData.length * Math.cos(rad);
  const ey = center + boltData.length * Math.sin(rad);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-0 overflow-visible">
      <LightningBolt 
          key={boltData.id} 
          active={isActive} 
          startX={sx} startY={sy} 
          endX={ex} endY={ey}
          viewBox="0 0 800 800"
          segments={12 + Math.floor(boltData.length / 25)} 
          amplitude={10 + Math.random() * 20} 
          glowIntensity={3}
          thickness={boltData.thickness} 
          branchIntensity={boltData.branchIntensity} 
          animationDuration={boltData.travelTime} // This is now very short (Strike)
          lingerDuration={boltData.fadeDuration} // This is now long (Fade)
          className="opacity-90 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]" 
          color="hsl(var(--primary))"
      />
    </div>
  );
});

const CoreEmblem: React.FC = React.memo(() => (
  <div className="relative flex items-center justify-center w-[200px] h-[200px] md:w-[280px] md:h-[280px]">
    
    {/* 1. The Discharge Effect (Behind the Core but allowed to overflow) */}
    <CoreDischarge />

    {/* 2. Outer Containment Ring (Subtle rotation) */}
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 opacity-10 border border-dashed border-primary rounded-full"
    />
    
    <MotionDiv
      animate={{ rotate: -360 }}
      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      className="absolute inset-4 opacity-5 border border-dotted border-white rounded-full"
    />

    {/* 3. The Core Source (Zap Icon) */}
    <MotionDiv
      animate={{ 
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 10px rgba(var(--primary),0.2))',
          'drop-shadow(0 0 20px rgba(var(--primary),0.5))', 
          'drop-shadow(0 0 10px rgba(var(--primary),0.2))'
        ]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="z-10 relative flex items-center justify-center bg-background/80 backdrop-blur-md rounded-full p-6 border border-primary/20 shadow-2xl"
    >
      <Zap className="text-primary w-12 h-12 md:w-20 md:h-20 fill-current" strokeWidth={0} />
    </MotionDiv>
  </div>
));

// Helper: Convert Hex to HSL for Tailwind CSS Variables
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

// Draggable Wrapper for Groups - Memoized
const DraggableGroupItem = React.memo(({
  groupName,
  groupNodes,
  index,
  containerRef,
  moveGroup,
  removeSegment,
  removeGroup, 
  toggleSegment,
  setPWM,
  lastReorderTime,
  className,
  onDragStart,
  onDragEnd
}: {
  groupName: string,
  groupNodes: Segment[],
  index: number,
  containerRef: React.RefObject<HTMLDivElement>,
  moveGroup: (from: number, to: number) => void,
  removeSegment: (id: string) => void,
  removeGroup: (name: string) => void, 
  toggleSegment: (id: string) => void,
  setPWM: any,
  lastReorderTime: React.MutableRefObject<number>,
  className: string,
  onDragStart: () => void,
  onDragEnd: () => void
}) => {
  const controls = useDragControls();
  const { sendCommand } = useWebSocket(); // Use hook here to avoid prop drilling if possible, or pass it down

  const handleDrag = (event: any, info: any) => {
    if (!containerRef.current) return;
    
    const now = Date.now();
    if (now - lastReorderTime.current < 400) return;

    const dragX = info.point.x;
    const dragY = info.point.y;
    
    const items = Array.from(containerRef.current.querySelectorAll('.group_area')) as HTMLElement[];
    
    let targetIndex = -1;

    items.forEach((item, idx) => {
      if (idx === index) return; 

      const rect = item.getBoundingClientRect();
      const isOver = 
        dragX > rect.left && 
        dragX < rect.right && 
        dragY > rect.top && 
        dragY < rect.bottom;

      if (isOver) {
        targetIndex = idx;
      }
    });

    if (targetIndex !== -1 && targetIndex !== index) {
      moveGroup(index, targetIndex);
      lastReorderTime.current = Date.now();
    }
  };

  const handleToggle = useCallback((id: string) => {
    // Logic needs access to current segment state, which might be stale if just passed as prop.
    // However, for optimization, we should fetch fresh state from store or rely on groupNodes.
    const seg = groupNodes.find(s => s.num_of_node === id);
    if (!seg) return;

    if (seg.regBitIndex !== undefined) {
        toggleSegment(id);
        const allRegisterSegments = groupNodes.filter(s => s.gpio === seg.gpio && s.regBitIndex !== undefined);
        let newByteValue = 0;
        allRegisterSegments.forEach(s => {
            let isOn = s.is_led_on === 'on';
            if (s.num_of_node === id) {
                 isOn = !isOn; // Apply toggle locally for calculation
            }
            if (isOn) {
                newByteValue |= (1 << (s.regBitIndex || 0));
            }
        });
        sendCommand(CMD.SR_STATE, seg.gpio || 0, newByteValue);
    } else {
        toggleSegment(id);
        sendCommand(seg.is_led_on === 'on' ? CMD.LED_OFF : CMD.LED_ON, seg.gpio || 0, 0);
    }
  }, [toggleSegment, groupNodes, sendCommand]);

  const handleInternalReorder = useCallback((newNodes: Segment[]) => {
    // We need to update the global segments list
    // This requires a callback prop to the parent or a store action that handles reordering a subset
    // For simplicity, we assume parent handles setSegments logic via store, but here we invoke a prop if provided.
    // In this specific architecture, SegmentGroup calls onReorder with NEW list of segments for that group.
    
    // We need access to the GLOBAL setSegments to merge this. 
    // This is getting complex to prop drill. 
    // ideally store should have `reorderGroup(groupName, newSegments)`.
    
    // Falling back to the prop drilled method from original code for stability.
    useSegments.getState().setSegments([
        ...useSegments.getState().segments.filter(s => (s.group || "basic") !== groupName),
        ...newNodes
    ]);
  }, [groupName]);

  return (
    <MotionDiv
      layout="position"
      drag
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={0.1}
      onDragStart={onDragStart}
      onDrag={handleDrag}
      onDragEnd={(event: any, info: any) => {
        onDragEnd(); 
        const thresholdY = window.innerHeight - 110;
        if (info.point.y > thresholdY) {
          removeGroup(groupName);
        }
      }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("group_area z-0 hover:z-10 relative", className)}
    >
      <SegmentGroup 
        name={groupName}
        segments={groupNodes}
        dragHandle={
          <div 
             className="cursor-grab active:cursor-grabbing text-primary hover:text-foreground transition-colors"
             onPointerDown={(e) => controls.start(e)}
             style={{ touchAction: 'none' }}
          >
             <GripHorizontal size={20} />
          </div>
        }
        onReorder={handleInternalReorder}
        onRemove={removeSegment}
        onToggle={handleToggle}
        onPWMChange={setPWM}
        onToggleBit={() => {}} 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </MotionDiv>
  );
});


export default function DashboardPage(): React.JSX.Element {
  const { segments, removeSegment, removeGroup, toggleSegment, setPWM } = useSegments();
  const { removeSchedulesByTarget } = useSchedulerStore(); // Get from store directly
  const { settings } = useSettingsStore();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<string>("DETECTING");
  
  useSchedulerEngine();
  
  const groupsContainerRef = useRef<HTMLDivElement>(null);
  const lastGroupReorderTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [orderedGroupKeys, setOrderedGroupKeys] = useState<string[]>([]);
  const t = translations[settings.language];

  // Logic: Handle Segment/Group Deletion
  const handleRemoveSegment = useCallback((id: string) => {
    removeSchedulesByTarget(id);
    removeSegment(id);
  }, [removeSchedulesByTarget, removeSegment]);

  const handleRemoveGroup = useCallback((groupName: string) => {
    const targetIds = segments.filter(s => (s.group || "basic") === groupName).map(s => s.num_of_node);
    targetIds.forEach(id => removeSchedulesByTarget(id));
    removeGroup(groupName);
  }, [segments, removeSchedulesByTarget, removeGroup]);

  // Logic: Apply Theme Colors
  useEffect(() => {
    const hsl = hexToHSL(settings.primaryColor);
    document.documentElement.style.setProperty('--primary', hsl);
  }, [settings.primaryColor]);
  
  // Logic: Direction (RTL/LTR)
  useEffect(() => {
    document.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [settings.language]);

  // Logic: Device Detection
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) {
        setDeviceType("MOBILE");
    } else {
        setDeviceType("DESKTOP");
    }
  }, []);

  // Logic: Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  // Logic: Audio Engine (Moved logic here to keep render clean)
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
        // Interaction policy might block this, handled by catch
        await audioRef.current.play();
      } catch (e: unknown) {
        // Silent fail for autoplay policy
      }
    };
    void handlePlayback();
  }, [settings.bgMusic, settings.currentTrackIndex, settings.volume]);

  // Logic: Grouping Segments
  const groupedSegments = useMemo(() => {
    const groups: Record<string, Segment[]> = {};
    segments.forEach((seg) => {
      const groupName = seg.group || "basic"; 
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(seg);
    });
    return groups;
  }, [segments]);

  // Logic: Order Maintenance for Groups
  useEffect(() => {
    const currentKeys = Object.keys(groupedSegments);
    setOrderedGroupKeys(prev => {
        const newKeys = [...prev];
        currentKeys.forEach(k => {
            if (!newKeys.includes(k)) newKeys.push(k);
        });
        return newKeys.filter(k => currentKeys.includes(k));
    });
  }, [groupedSegments]);

  const moveGroup = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedGroupKeys(prev => {
        const newOrder = [...prev];
        const [movedItem] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, movedItem);
        return newOrder;
    });
  }, []);

  const bgClass = useMemo(() => {
    if (settings.backgroundEffect === 'grid') return 'graph-paper';
    return 'pattern-bg';
  }, [settings.backgroundEffect]);

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <div className={cn(
          "min-h-screen transition-colors duration-500 flex flex-col overflow-x-hidden bg-background text-foreground",
          bgClass,
          settings.animations && "animate-grid",
          getFontClass(settings.dashboardFont) 
      )}>
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-3 md:px-6 pt-6 md:pt-12 flex-1 pb-32 md:pb-40 w-full relative">
          {segments.length === 0 ? (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 md:py-16 min-h-[60vh]">
              <MotionDiv onClick={() => setIsMenuOpen(true)} className="relative z-20 cursor-pointer flex flex-col items-center gap-8 md:gap-10">
                {/* REPLACED WITH NEW SPORADIC DISCHARGE EMBLEM */}
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
              className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 relative"
            >
              <AnimatePresence mode="popLayout">
                {orderedGroupKeys.map((groupName, index) => {
                   const groupNodes = groupedSegments[groupName] || [];
                   const isLastAndOdd = orderedGroupKeys.length % 2 !== 0 && index === orderedGroupKeys.length - 1;
                   const spanClass = isLastAndOdd ? "col-span-1 xl:col-span-2" : "col-span-1";

                   return (
                     <DraggableGroupItem
                       key={groupName}
                       groupName={groupName}
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
                       onDragStart={() => setIsDragging(true)}
                       onDragEnd={() => setIsDragging(false)}
                     />
                   );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="fixed bottom-2 md:bottom-4 left-0 w-full px-2 md:px-6 z-[40] transition-colors duration-500 pointer-events-none">
          <div className="relative overflow-hidden bg-background/80 dark:bg-background/50 backdrop-blur-xl backdrop-saturate-150 border border-border/50 dark:border-white/5 rounded-xl md:rounded-2xl shadow-2xl py-2 px-4 md:py-4 md:px-10 flex items-center justify-between h-14 md:h-20 max-w-7xl mx-auto pointer-events-auto group">
            
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/10 w-full overflow-visible">
               <MotionDiv
                  initial={{ left: "-20%" }}
                  animate={{ left: "120%" }}
                  transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 1 
                  }}
                  className="absolute top-0 bottom-0 w-[150px] h-full z-10"
                  style={{
                      background: 'linear-gradient(90deg, transparent 0%, hsla(var(--primary), 0.3) 50%, hsl(var(--primary)) 100%)',
                  }}
               >
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white shadow-[0_0_15px_3px_hsl(var(--primary))] rounded-full z-20" />
                   
                   <MotionDiv 
                      animate={{ 
                          height: [4, 16, 4, 12, 4], 
                          opacity: [0, 1, 0.5, 1, 0],
                      }}
                      transition={{ duration: 0.1, repeat: Infinity, repeatType: "mirror" }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] bg-white/90 blur-[0.5px] shadow-[0_0_8px_1px_hsl(var(--primary))]"
                   />
               </MotionDiv>
            </div>

            <div className="flex items-center gap-2 md:gap-3 font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary">
              <Cpu className="w-3 h-3 md:w-4 md:h-4" /> 
              <span className="opacity-60">ESP32-NODE-PRO</span>
            </div>

            <AnimatePresence>
              {isDragging && (
                <MotionDiv 
                  initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
                  className="absolute inset-0 flex items-center justify-center bg-destructive/95 text-destructive-foreground font-black uppercase tracking-[0.2em] md:tracking-[0.3em] gap-2 md:gap-3 z-50 pointer-events-none rounded-xl md:rounded-2xl"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-[9px] md:text-[10px]">{t.release_delete}</span>
                </MotionDiv>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-end">
               <div className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-40 hidden sm:block">Secure Link V3.1</div>
               <div className="text-[8px] md:text-[9px] font-bold text-primary mt-0.5 md:mt-1 flex items-center gap-1 md:gap-1.5 opacity-80">
                  {deviceType === 'MOBILE' ? <Smartphone size={10} /> : <Laptop size={10} />}
                  <span className="hidden xs:inline">{t.footer_ver} =</span> {deviceType} VER
               </div>
            </div>
          </div>
        </footer>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </MotionConfig>
  );
}