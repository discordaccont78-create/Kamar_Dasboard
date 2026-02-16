
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Terminal, RectangleHorizontal, Columns, LayoutGrid } from 'lucide-react';
import { useSettingsStore } from '../../lib/store/settings';
import { useCursorStore } from '../../lib/store/cursorStore';
import { useSoundFx } from '../../hooks/useSoundFx';
import { cn, getFontClass } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';
import { ConnectionStatus } from './ConnectionStatus';
import { LightningBolt } from '../Effects/LightningBolt';
import { ElectricWaves } from './ElectricWaves';
import { DigitalClock } from './DigitalClock';
import { CyberTitle } from './CyberTitle';
import { ControlButton } from './HeaderControls';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { setCharged } = useCursorStore();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const [sparkState, setSparkState] = useState<'idle' | 'discharge' | 'impact'>('idle');
  const [isLogoCharged, setIsLogoCharged] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const [cursorBolt, setCursorBolt] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

  // --- SPACE CALCULATION REFS ---
  const leftIslandRef = useRef<HTMLDivElement>(null);
  const rightIslandRef = useRef<HTMLDivElement>(null); 
  const [mobileSlots, setMobileSlots] = useState(0);

  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  const titleFontClass = getFontClass(settings.dashboardFont);
  const thirdColor = settings.cursorColor || '#daa520';
  const groupCols = settings.groupColumnCount || 2;
  
  // --- GAP LOGIC ---
  const gapSize = settings.headerGap ?? 40;
  const mobileGap = Math.min(gapSize, 50);

  const waveWidth = gapSize + 120;
  const waveLeft = -(gapSize + 60);
  const mobileWaveWidth = mobileGap + 120;
  const mobileWaveLeft = -(mobileGap + 60);
  
  const showWaves = settings.animations && (settings.showHeaderWaves ?? true);
  
  // --- INTELLIGENT SPACE DETECTION ---
  useEffect(() => {
    const calculateSpace = () => {
        if (!rightIslandRef.current) return;
        
        const width = rightIslandRef.current.offsetWidth;
        const mandatoryWidth = 100; // Wifi + Settings + Gaps
        
        const availableSpace = width - mandatoryWidth;
        const buttonUnit = 42; 
        
        const slots = Math.floor(availableSpace / buttonUnit);
        setMobileSlots(Math.max(0, slots));
    };

    calculateSpace();
    const observer = new ResizeObserver(() => {
        requestAnimationFrame(calculateSpace);
    });

    if (rightIslandRef.current) observer.observe(rightIslandRef.current);
    if (leftIslandRef.current) observer.observe(leftIslandRef.current);
    window.addEventListener('resize', calculateSpace);

    return () => {
        observer.disconnect();
        window.removeEventListener('resize', calculateSpace);
    };
  }, [settings.title, settings.dashboardFont]);

  // Spark Loop
  useEffect(() => {
      if (!settings.animations) return;
      const loop = setInterval(() => {
          setSparkState('discharge');
          playSpark(); 
          setTimeout(() => {
              setSparkState('impact');
              playCharge();
              setIsLogoCharged(true);
              setTimeout(() => {
                  setIsLogoCharged(false);
              }, 3000);
          }, 250);
          setTimeout(() => {
              setSparkState('idle');
          }, 750);
      }, 60000); // 60s Interval
      return () => clearInterval(loop);
  }, [settings.animations, playSpark, playCharge]);

  // Interactive Spark
  useEffect(() => {
      if (!isLogoCharged || !logoRef.current) return;
      const handleMouseMove = (e: MouseEvent) => {
          if (!isLogoCharged) return; 
          const rect = logoRef.current!.getBoundingClientRect();
          const logoCenterX = rect.left + rect.width / 2;
          const logoCenterY = rect.top + rect.height / 2;
          const dist = Math.hypot(e.clientX - logoCenterX, e.clientY - logoCenterY);
          if (dist < 150) {
              playSpark();
              setCursorBolt({
                  start: { x: logoCenterX, y: logoCenterY },
                  end: { x: e.clientX, y: e.clientY }
              });
              setIsLogoCharged(false);
              setCharged(true);
              setTimeout(() => {
                  setCharged(false);
              }, 1500);
              setTimeout(() => setCursorBolt(null), 300);
          }
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLogoCharged, playSpark, setCharged]);

  const toggleTheme = () => {
    playToggle(settings.theme === 'light');
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleLanguage = () => {
    playToggle(settings.language === 'en');
    updateSettings({ language: settings.language === 'en' ? 'fa' : 'en' });
  };

  const handleOpenMenu = () => {
    playClick();
    onOpenMenu();
  };

  const handleOpenScheduler = () => {
    playClick();
    setIsSchedulerOpen(true);
  };

  const handleUpdateGroupCols = (c: 1 | 2 | 3) => {
      playClick();
      updateSettings({ groupColumnCount: c });
  };

  // --- ANIMATION VARIANTS ---
  const islandVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.9 },
    visible: { y: 0, x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    floatLeft: { 
      y: [0, -3, 1, -2, 0], x: [0, 1, 0, 1, 0], opacity: 1, scale: 1,
      transition: { y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, x: { duration: 5, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0.5 }}
    },
    floatRight: { 
      y: [0, 2, -1, 1, 0], x: [0, -2, 1, -1, 0], opacity: 1, scale: 1,
      transition: { y: { duration: 8, repeat: Infinity, ease: "easeInOut" }, x: { duration: 9, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0.5 }}
    },
    floatWifi: {
      y: [0, -2, 2, -1, 1, 0], x: [0, 1, -1, 1, -1, 0], opacity: 1, scale: 1,
      transition: { y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" }, x: { duration: 4, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0.5 }}
    }
  };

  const logoVariants = {
    idle: { scale: 1, rotate: 0 },
    impact: { scale: [1, 1.3, 1.1, 1], rotate: [0, -10, 10, 0], transition: { duration: 0.4, ease: "backOut" } },
    charged: {
        scale: 1.1, x: [0, -1, 1, -1, 0], y: [0, 1, -1, 1, 0],
        transition: { scale: { duration: 0.2 }, x: { duration: 0.1, repeat: Infinity }, y: { duration: 0.1, repeat: Infinity }}
    }
  };

  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  const CLIP_RIGHT_MAIN = "polygon(24px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div 
        className="max-w-[1400px] mx-auto flex items-stretch justify-between relative pointer-events-auto h-[60px] md:h-[72px] gap-[var(--header-gap-mobile)] md:gap-[var(--header-gap)]"
        style={{ '--header-gap': `${gapSize}px`, '--header-gap-mobile': `${mobileGap}px` } as React.CSSProperties}
      >
        {cursorBolt && (
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-visible">
                <LightningBolt 
                    startX={cursorBolt.start.x} startY={cursorBolt.start.y} 
                    endX={cursorBolt.end.x} endY={cursorBolt.end.y}
                    viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
                    className="w-full h-full"
                    amplitude={40} segments={12} glowIntensity={4} thickness={1}
                />
            </div>
        )}

        {/* --- LEFT ISLAND --- */}
        <MotionDiv
          ref={leftIslandRef}
          variants={islandVariants}
          initial="hidden"
          animate={(settings.floatingIslands ?? true) ? "floatLeft" : "visible"}
          className="relative drop-shadow-xl filter group z-30 shrink-0 w-fit max-w-[65vw]" 
        >
           <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_LEFT }} />
           <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_LEFT }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
           </div>
           
           <div className="relative h-full flex items-center pl-4 pr-10 md:pl-8 md:pr-14">
              <div className="flex items-center gap-2 md:gap-5 z-10 relative">
                  <div ref={logoRef} className="relative z-30 group flex items-center justify-center shrink-0">
                    <MotionDiv 
                        className="relative w-8 h-8 md:w-11 md:h-11 flex items-center justify-center cursor-pointer"
                        animate={sparkState === 'impact' ? 'impact' : (isLogoCharged ? 'charged' : 'idle')}
                        variants={logoVariants}
                    >
                        <Zap className="absolute inset-0 w-full h-full text-primary/20" strokeWidth={1} />
                        <MotionDiv
                            className="absolute inset-0 w-full h-full overflow-hidden"
                            initial={{ clipPath: "inset(100% 0 0 0)" }}
                            animate={{
                                clipPath: (isLogoCharged || sparkState === 'impact') ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
                                filter: sparkState === 'impact' ? "brightness(1.5)" : "brightness(1)"
                            }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        >
                             <Zap className="w-full h-full text-primary fill-current drop-shadow-[0_0_15px_rgba(218,165,32,0.6)]" strokeWidth={0} />
                        </MotionDiv>
                    </MotionDiv>
                  </div>
                  
                  <div className="absolute top-1/2 left-8 right-0 -translate-y-1/2 h-12 pointer-events-none z-20">
                      <LightningBolt active={sparkState === 'discharge'} startX={100} endX={0} startY={10} endY={10} segments={20} amplitude={3} glowIntensity={1} thickness={0.6} viewBox="0 0 100 20" className="opacity-90"/>
                  </div>

                  <div className="flex flex-col justify-center gap-0.5 md:gap-1 relative z-30 min-w-0">
                    <CyberTitle 
                        text={settings.title} 
                        fontClass={titleFontClass}
                        discharging={sparkState === 'discharge'} 
                        accentColor={thirdColor}
                    />
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <span className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-sm transition-all duration-300", sparkState === 'impact' ? "bg-white shadow-[0_0_8px_white]" : "bg-primary")} /> 
                        <div className="flex items-center gap-1 md:gap-1.5 text-[7px] md:text-[9px] font-mono font-bold uppercase tracking-[0.1em] text-muted-foreground/80 whitespace-nowrap">
                            <span className="opacity-50">SYS.VER</span>
                            <span className="text-primary">3.1</span>
                            <span className="w-px h-2 bg-border/50 mx-0.5 hidden xs:block" />
                            <Terminal size={8} className="hidden xs:block" />
                            <span className="hidden xs:inline">NODE_CTRL</span>
                        </div>
                    </div>
                  </div>
              </div>
           </div>
        </MotionDiv>

        {/* --- RIGHT SECTION --- */}
        <div className="flex items-stretch gap-0.5 md:gap-1 min-w-0 flex-1 justify-end">
            <MotionDiv
                ref={rightIslandRef} 
                variants={islandVariants}
                initial="hidden"
                animate={(settings.floatingIslands ?? true) ? "floatRight" : "visible"}
                transition={{ delay: 0.1 }}
                className="relative drop-shadow-xl filter flex-1 z-20 max-w-full"
            >
                {showWaves && (
                    <>
                        <ElectricWaves color={settings.cursorColor || "#daa520"} width={mobileWaveWidth} left={mobileWaveLeft} opacity={(settings.headerWaveOpacity ?? 90) / 100} dynamicIntensity={settings.headerDynamicIntensity || false} className="flex md:hidden" />
                        <ElectricWaves color={settings.cursorColor || "#daa520"} width={waveWidth} left={waveLeft} opacity={(settings.headerWaveOpacity ?? 90) / 100} dynamicIntensity={settings.headerDynamicIntensity || false} className="hidden md:flex" />
                    </>
                )}
                
                <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_RIGHT_MAIN }} />
                <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_RIGHT_MAIN }}>
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
                </div>
                
                <div className="relative h-full w-full flex items-center justify-end md:justify-between pl-3 md:pl-4 pr-6 md:pr-8">
                    <DigitalClock />
                    
                    {/* DESKTOP CONTROLS */}
                    <div className="hidden md:flex items-center gap-1.5 md:gap-3 z-10 ml-auto justify-end h-full">
                        <div className="hidden lg:flex items-center gap-1 mr-2 bg-black/10 dark:bg-white/5 p-1 rounded-md border border-white/5">
                            <button onClick={() => handleUpdateGroupCols(1)} className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", groupCols === 1 ? "text-primary bg-white/10 shadow-[0_0_5px_rgba(0,0,0,0.2)]" : "text-muted-foreground")} title="1 Column Groups"><RectangleHorizontal size={14} /></button>
                            <button onClick={() => handleUpdateGroupCols(2)} className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", groupCols === 2 ? "text-primary bg-white/10 shadow-[0_0_5px_rgba(0,0,0,0.2)]" : "text-muted-foreground")} title="2 Columns Groups"><Columns size={14} /></button>
                            <button onClick={() => handleUpdateGroupCols(3)} className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", groupCols === 3 ? "text-primary bg-white/10 shadow-[0_0_5px_rgba(0,0,0,0.2)]" : "text-muted-foreground")} title="3 Columns Groups"><LayoutGrid size={14} /></button>
                        </div>
                        <div className="w-px h-6 md:h-8 bg-border/40 mx-0.5 md:mx-1 hidden lg:block" />

                        <ControlButton onClick={handleOpenScheduler} icon={CalendarClock} title={t.scheduler} active={isSchedulerOpen} />
                        <div className="w-px h-6 md:h-8 bg-border/40 mx-0.5 md:mx-1" />
                        <ControlButton onClick={toggleTheme} icon={settings.theme === 'light' ? Moon : Sun} title={t.switch_env} />
                        <ControlButton onClick={toggleLanguage} label={settings.language === 'en' ? 'FA' : 'EN'} title={t.switch_lang} />
                        <ControlButton onClick={handleOpenMenu} icon={Settings} title={t.sys_config} variant="primary" />
                    </div>

                    {/* MOBILE CONTROLS */}
                    <div className="flex md:hidden items-center justify-end gap-1.5 z-10 w-full h-full">
                        <AnimatePresence>
                                {mobileSlots >= 3 && (
                                    <MotionDiv initial={{ width: 0, opacity: 0, scale: 0.5 }} animate={{ width: 'auto', opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0.5 }} className="overflow-hidden">
                                        <ControlButton onClick={handleOpenScheduler} icon={CalendarClock} title={t.scheduler} active={isSchedulerOpen} />
                                    </MotionDiv>
                                )}
                                {mobileSlots >= 2 && (
                                    <MotionDiv initial={{ width: 0, opacity: 0, scale: 0.5 }} animate={{ width: 'auto', opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0.5 }} className="overflow-hidden">
                                        <ControlButton onClick={toggleLanguage} label={settings.language === 'en' ? 'FA' : 'EN'} title={t.switch_lang} />
                                    </MotionDiv>
                                )}
                                {mobileSlots >= 1 && (
                                    <MotionDiv initial={{ width: 0, opacity: 0, scale: 0.5 }} animate={{ width: 'auto', opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0.5 }} className="overflow-hidden">
                                        <ControlButton onClick={toggleTheme} icon={settings.theme === 'light' ? Moon : Sun} title={t.switch_env} />
                                    </MotionDiv>
                                )}
                        </AnimatePresence>
                        {mobileSlots >= 1 && <div className="w-px h-5 bg-border/30 mx-0.5" />}
                        <ControlButton onClick={handleOpenMenu} icon={Settings} variant="primary" className="border-primary/50" />
                    </div>
                </div>
            </MotionDiv>

            <MotionDiv
                variants={islandVariants}
                initial="hidden"
                animate={(settings.floatingIslands ?? true) ? "floatWifi" : "visible"}
                transition={{ delay: 0.2 }}
                className="relative z-20 shrink-0 drop-shadow-xl filter" 
            >
                <ConnectionStatus variant="glass" />
            </MotionDiv>
        </div>
      </div>
      <div className="hidden md:block">
        <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
      </div>
    </header>
  );
};
