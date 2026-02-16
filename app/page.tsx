
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MotionConfig, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header/Header';
import { SideMenu } from '../components/UI/SideMenu';
import { DraggableGroupItem } from '../components/Group/DraggableGroupItem';
import { EmptyDashboardState } from '../components/Dashboard/EmptyDashboardState';
import { DashboardFooter } from '../components/Dashboard/DashboardFooter';
import { useSegments } from '../lib/store/segments';
import { useSettingsStore } from '../lib/store/settings';
import { useSchedulerStore } from '../lib/store/scheduler';
import { useAudioStore } from '../lib/store/audioStore'; 
import { useUIStore } from '../lib/store/uiState'; 
import { useSchedulerEngine } from '../hooks/useSchedulerEngine';
import { cn, getFontClass } from '../lib/utils';
import { translations } from '../lib/i18n';
import { MUSIC_TRACKS } from '../lib/constants';
import { Segment } from '../types/index';

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
  const { segments, groups, removeSegment, removeGroup, toggleSegment, setPWM, reorderGroups } = useSegments();
  const { removeSchedulesByTarget } = useSchedulerStore(); 
  const { settings } = useSettingsStore();
  const { setAudioState, seekRequest, clearSeekRequest } = useAudioStore(); 
  const { setOutputForm, setActiveSection } = useUIStore(); 
  
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [dragType, setDragType] = useState<'none' | 'group' | 'segment'>('none');

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
  const displayGroups = useMemo(() => {
      const allGroups = [...groups];
      const definedIds = new Set(groups.map(g => g.id));

      segments.forEach(seg => {
          const gId = seg.groupId || "basic";
          if (!definedIds.has(gId)) {
              allGroups.push({ id: gId, name: gId, order: allGroups.length, columnCount: 2 });
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
            <EmptyDashboardState onOpenMenu={() => setIsMenuOpen(true)} t={t} />
          ) : (
            <div 
              ref={groupsContainerRef}
              className={cn("grid relative", mainGridClass)}
            >
              <AnimatePresence mode="popLayout">
                {displayGroups.map((groupConfig, index) => {
                   const groupNodes = groupedSegments[groupConfig.id] || [];
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
                       className="col-span-1"
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

        <DashboardFooter 
            isDragging={dragType !== 'none'}
            dragType={dragType}
            floatingIslands={settings.floatingIslands ?? true}
            cursorColor={settings.cursorColor}
            t={t}
            deviceInfo={deviceInfo}
        />

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </MotionConfig>
  );
}
