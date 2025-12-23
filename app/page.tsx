
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MotionConfig, AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { SegmentGroup } from '../components/Group/SegmentGroup';
import { ToastContainer } from '../components/UI/Toast';
import { CursorGlobalStyle } from '../components/UI/CursorGlobalStyle';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useConnection } from '../lib/store/connection';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useUIStore } from '../lib/store/uiState'; // Import UI Store for Drag State
import { CMD, Segment } from '../types/index';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSchedulerEngine } from '../hooks/useSchedulerEngine';
import { Zap, Trash2, Hexagon, Cpu, Laptop, Smartphone, GripHorizontal, AlertOctagon } from 'lucide-react';
import { cn, getFontClass } from '../lib/utils';
import { translations } from '../lib/i18n';
import { MUSIC_TRACKS } from '../lib/constants';

// Workaround for Framer Motion types in this specific ESM environment
const MotionDiv = motion.div as any;
const MotionFooter = motion.footer as any;

const CoreEmblem: React.FC = React.memo(() => (
  <div className="relative flex items-center justify-center">
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute"
    >
      <Hexagon className="text-foreground/80 dark:text-foreground/60 w-[120px] h-[120px] md:w-[180px] md:h-[180px]" strokeWidth={1.5} />
    </MotionDiv>
    <MotionDiv
      animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="bg-card/30 dark:bg-card/30 backdrop-blur-md border-2 border-primary p-4 md:p-6 rounded-full shadow-[0_0_40px_rgba(var(--primary),0.2)] z-10 transition-colors"
    >
      <Zap className="text-primary w-8 h-8 md:w-12 md:h-12" fill="currentColor" />
    </MotionDiv>
  </div>
));

// Draggable Wrapper for Groups - Memoized
const DraggableGroupItem = React.memo(({
  groupName,
  groupNodes,
  index,
  containerRef,
  moveGroup,
  segments,
  setSegments,
  removeSegment,
  removeGroup, 
  toggleSegment,
  sendCommand,
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
  segments: Segment[],
  setSegments: (s: Segment[]) => void,
  removeSegment: (id: string) => void,
  removeGroup: (name: string) => void, 
  toggleSegment: (id: string) => void,
  sendCommand: any,
  setPWM: any,
  lastReorderTime: React.MutableRefObject<number>,
  className: string,
  onDragStart: () => void,
  onDragEnd: () => void
}) => {
  const controls = useDragControls();
  const { setDraggingId, setIsOverTrash } = useUIStore();

  const handleDrag = (event: any, info: any) => {
    // 1. Check Delete Zone Collision (Precise)
    const deleteZone = document.getElementById('delete-zone');
    if (deleteZone) {
        const rect = deleteZone.getBoundingClientRect();
        // Check if cursor is strictly inside the box
        const isOver = 
            info.point.y >= rect.top && 
            info.point.y <= rect.bottom && 
            info.point.x >= rect.left && 
            info.point.x <= rect.right;
        
        setIsOverTrash(isOver);
    }

    // 2. Reordering Logic
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
      const isOver = dragX > rect.left && dragX < rect.right && dragY > rect.top && dragY < rect.bottom;
      if (isOver) targetIndex = idx;
    });

    if (targetIndex !== -1 && targetIndex !== index) {
      moveGroup(index, targetIndex);
      lastReorderTime.current = Date.now();
    }
  };

  const handleInternalReorder = useCallback((newNodes: Segment[]) => {
    const otherGroupsSegments = segments.filter(s => (s.group || "basic") !== groupName);
    setSegments([...otherGroupsSegments, ...newNodes]);
  }, [segments, groupName, setSegments]);

  return (
    <MotionDiv
      layout="position"
      drag
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={0.1}
      onDragStart={() => {
        setDraggingId(groupName); // Track that we are dragging THIS group
        onDragStart();
      }}
      onDrag={handleDrag}
      onDragEnd={(event: any, info: any) => {
        setDraggingId(null);
        setIsOverTrash(false);
        onDragEnd(); 
        
        // Final Check for Deletion
        const deleteZone = document.getElementById('delete-zone');
        if (deleteZone) {
            const rect = deleteZone.getBoundingClientRect();
            const isOver = 
                info.point.y >= rect.top && 
                info.point.y <= rect.bottom && 
                info.point.x >= rect.left && 
                info.point.x <= rect.right;
            
            if (isOver) {
                removeGroup(groupName);
            }
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
        onToggle={useCallback((id: string) => {
            // Simplified Toggle Wrapper Logic inside Group
            const seg = segments.find(s => s.num_of_node === id);
            if (!seg) return;
            if (seg.regBitIndex !== undefined) {
                toggleSegment(id);
                // logic for reg byte recalc...
                const allRegisterSegments = segments.filter(s => s.gpio === seg.gpio && s.regBitIndex !== undefined);
                setTimeout(() => { // Small tick to allow store update
                   const updatedSegs = useSegments.getState().segments;
                   const targetSegs = updatedSegs.filter(s => s.gpio === seg.gpio && s.groupType === 'register');
                   let newByteValue = 0;
                   targetSegs.forEach(s => {
                      if (s.is_led_on === 'on') newByteValue |= (1 << (s.regBitIndex || 0));
                   });
                   sendCommand(CMD.SR_STATE, seg.gpio || 0, newByteValue);
                }, 0);
            } else {
                toggleSegment(id);
                sendCommand(seg.is_led_on === 'on' ? CMD.LED_OFF : CMD.LED_ON, seg.gpio || 0, 0);
            }
        }, [segments, toggleSegment, sendCommand])}
        onPWMChange={setPWM}
        onToggleBit={() => {}} 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </MotionDiv>
  );
});


export default function DashboardPage(): React.JSX.Element {
  const { segments, setSegments, removeSegment, removeGroup, toggleSegment, setPWM } = useSegments();
  const { removeSchedulesByTarget } = useSchedulerStore();
  const { settings } = useSettingsStore();
  
  // Consuming the Drag State
  const { draggingId, isOverTrash } = useUIStore();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<string>("DETECTING");
  
  // Init Scheduler Engine
  useSchedulerEngine();
  
  const groupsContainerRef = useRef<HTMLDivElement>(null);
  const lastGroupReorderTime = useRef<number>(0);
  
  const [orderedGroupKeys, setOrderedGroupKeys] = useState<string[]>([]);
  
  const t = translations[settings.language];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sendCommand } = useWebSocket();

  const handleRemoveSegment = useCallback((id: string) => {
    removeSchedulesByTarget(id);
    removeSegment(id);
  }, [removeSchedulesByTarget, removeSegment]);

  const handleRemoveGroup = useCallback((groupName: string) => {
    const targetIds = segments.filter(s => (s.group || "basic") === groupName).map(s => s.num_of_node);
    targetIds.forEach(id => removeSchedulesByTarget(id));
    removeGroup(groupName);
  }, [segments, removeSchedulesByTarget, removeGroup]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', settings.primaryColor);
  }, [settings.primaryColor]);
  
  useEffect(() => {
    document.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [settings.language]);

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

  // Audio Player Logic
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
        console.warn("Audio playback failed:", e);
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

  const bgClass = settings.backgroundEffect === 'dots' ? 'dot-matrix' : 'graph-paper';

  return (
    <MotionConfig reducedMotion={settings.animations ? "never" : "always"}>
      <CursorGlobalStyle />

      <div className={cn(
          "min-h-screen transition-colors duration-500 flex flex-col overflow-x-hidden",
          bgClass,
          settings.animations && "animate-grid",
          getFontClass(settings.dashboardFont) 
      )}>
        <Header onOpenMenu={() => setIsMenuOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-3 md:px-6 pt-6 md:pt-12 flex-1 pb-32 md:pb-40 w-full relative">
          {segments.length === 0 ? (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 md:py-16 min-h-[60vh]">
              <MotionDiv onClick={() => setIsMenuOpen(true)} className="relative z-20 cursor-pointer flex flex-col items-center gap-6 md:gap-8">
                <CoreEmblem />
                <div className="text-center max-w-xs md:max-w-2xl px-4 md:px-8">
                  <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-primary">{t.hardware_intel}</h2>
                  <div className="h-0.5 w-24 md:w-32 bg-primary mx-auto opacity-40 my-3 md:my-4" />
                  <p className="text-xs md:text-sm font-bold text-gray-500 italic leading-relaxed uppercase tracking-[0.1em] mb-4 md:mb-6">
                    "{t.success_msg} <br/>
                    <span className="text-[#1A1C1E] dark:text-[#E0E0E0] not-italic border-b-2 border-primary transition-colors">{t.focus_effort}</span> {t.we_control}"
                  </p>
                </div>
                <button className="bg-card-light dark:bg-card-dark text-primary border-2 border-primary/40 px-6 py-3 md:px-10 md:py-4 rounded-chip font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] hover:bg-primary hover:text-black transition-all duration-300 shadow-xl">
                  <span className="flex items-center gap-2"><Zap size={14} /> {t.init_deploy}</span>
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
                       segments={segments}
                       setSegments={setSegments}
                       removeSegment={handleRemoveSegment}
                       removeGroup={handleRemoveGroup}
                       toggleSegment={toggleSegment}
                       sendCommand={sendCommand}
                       setPWM={setPWM}
                       lastReorderTime={lastGroupReorderTime}
                       className={spanClass}
                       onDragStart={() => {}}
                       onDragEnd={() => {}}
                     />
                   );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        {/* Footer / Smart Delete Zone */}
        <MotionFooter 
          id="delete-zone"
          layout
          initial={false}
          animate={
            // 1. If dragging and over trash -> Scale up, Red, Shake (if anims on)
            draggingId && isOverTrash ? { 
                scale: 1.05, 
                backgroundColor: "#ef4444", 
                borderColor: "#ef4444",
                y: settings.animations ? [0, -4, 0, 4, 0] : 0 
            } : 
            // 2. If just dragging -> Use Cursor Color, slight lift
            draggingId ? { 
                scale: 1.02, 
                backgroundColor: settings.cursorColor || "#daa520",
                borderColor: settings.cursorColor || "#daa520",
                y: -10
            } : 
            // 3. Default -> Normal style with Dark Mode awareness (Zinc 900 @ 60%)
            { 
                scale: 1, 
                // Light Mode: White 85% with subtle BLACK border for definition
                // Dark Mode: Zinc 900 60% with subtle WHITE border
                backgroundColor: settings.theme === 'dark' ? "rgba(24, 24, 27, 0.6)" : "rgba(255, 255, 255, 0.85)", 
                borderColor: settings.theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.08)",
                y: 0
            }
          }
          transition={{ 
            type: "spring", stiffness: 400, damping: 25,
            y: { duration: 0.2, repeat: (draggingId && isOverTrash && settings.animations) ? Infinity : 0 } // Repeat shake only when over trash
          }}
          className={cn(
            "fixed bottom-2 md:bottom-4 left-0 w-full px-2 md:px-6 z-[40] transition-colors duration-300",
            // If dragging, pointer events work for detection. If not, footer allows clicks on version/links
            draggingId ? "pointer-events-auto" : "pointer-events-auto"
          )}
        >
          <div className={cn(
            "rounded-xl md:rounded-2xl shadow-2xl py-2 px-4 md:py-4 md:px-10 flex items-center justify-between h-14 md:h-20 max-w-7xl mx-auto backdrop-blur-xl backdrop-saturate-150 border",
            // Text color logic
            draggingId ? "text-white" : "text-foreground"
          )}>
            
            {/* Left Content */}
            <div className="flex items-center gap-2 md:gap-3 font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em]">
               {draggingId ? (
                   isOverTrash ? <AlertOctagon className="w-4 h-4 md:w-5 md:h-5 animate-pulse" /> : <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
               ) : (
                   <Cpu className="w-3 h-3 md:w-4 md:h-4 text-primary" />
               )}
               <span className={cn("opacity-80", draggingId ? "font-bold" : "opacity-60")}>
                  {draggingId 
                    ? (isOverTrash ? "CONFIRM DELETION" : "DROP ZONE ACTIVE") 
                    : "ESP32-NODE-PRO"
                  }
               </span>
            </div>

            {/* Center / Action Message */}
            <AnimatePresence>
              {draggingId && (
                <MotionDiv 
                  initial={{ opacity: 0, scale: 0.5 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 text-white"
                >
                  {isOverTrash ? (
                    <>
                        <Trash2 className="w-5 h-5 md:w-6 md:h-6" /> 
                        <span className="text-[10px] md:text-xs">RELEASE TO DESTROY</span>
                    </>
                  ) : (
                    <span className="text-[9px] md:text-[10px] opacity-80">{t.release_delete}</span>
                  )}
                </MotionDiv>
              )}
            </AnimatePresence>

            {/* Right Content */}
            <div className="flex flex-col items-end">
               {!draggingId && (
                 <>
                    <div className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-40 hidden sm:block">Secure Link V3.1</div>
                    <div className="text-[8px] md:text-[9px] font-bold text-primary mt-0.5 md:mt-1 flex items-center gap-1 md:gap-1.5 opacity-80">
                        {deviceType === 'MOBILE' ? <Smartphone size={10} /> : <Laptop size={10} />}
                        <span className="hidden xs:inline">{t.footer_ver} =</span> {deviceType} VER
                    </div>
                 </>
               )}
            </div>
          </div>
        </MotionFooter>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
