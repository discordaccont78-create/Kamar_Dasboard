
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Terminal, Menu, RectangleHorizontal, Columns, LayoutGrid } from 'lucide-react';
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

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface HeaderProps {
    onOpenMenu: () => void;
}

// --- NEW CYBER TITLE COMPONENT ---
const CYBER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*<>";

const CyberTitle = ({ 
    text, 
    fontClass, 
    discharging, 
    accentColor 
}: { 
    text: string, 
    fontClass: string, 
    discharging: boolean, 
    accentColor: string
}) => {
  const [scrambleText, setScrambleText] = useState(text);
  
  // displayIndex: currently visible characters
  // targetIndex: desired visible characters based on mouse position
  const [displayIndex, setDisplayIndex] = useState(text.length);
  const [targetIndex, setTargetIndex] = useState(text.length);
  
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Common Styles for both Ghost and Visible Text
  const textStyles = cn(
      "text-lg md:text-3xl font-black uppercase tracking-[0.15em] leading-none whitespace-nowrap",
      fontClass
  );

  // 1. Reset state when prop text changes
  useEffect(() => {
      setDisplayIndex(text.length);
      setTargetIndex(text.length);
      setScrambleText(text);
  }, [text]);

  // 2. Scramble Logic (Only during Lightning Discharge)
  useEffect(() => {
    if (!discharging) return;
    
    let iteration = 0;
    const interval = setInterval(() => {
      setScrambleText(prev => 
        text.split("").map((char, index) => {
            if (index < iteration) return text[index];
            return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)];
        }).join("")
      );
      iteration += 1 / 4;
      if (iteration >= text.length) clearInterval(interval);
    }, 60);

    return () => clearInterval(interval);
  }, [discharging, text]);

  // 3. Smooth Transition Loop (The Typewriter Engine)
  // Moves displayIndex towards targetIndex one step at a time
  useEffect(() => {
      if (discharging) return; 

      if (displayIndex !== targetIndex) {
          const timeout = setTimeout(() => {
              setDisplayIndex(prev => {
                  if (prev < targetIndex) return prev + 1; // Type forward
                  if (prev > targetIndex) return prev - 1; // Delete backward
                  return prev;
              });
          }, 30); // Speed of character transition (ms)
          return () => clearTimeout(timeout);
      }
  }, [displayIndex, targetIndex, discharging]);

  // 4. Mouse Move Handler (Sets the TARGET, not the value directly)
  const handleMouseMove = (e: React.MouseEvent) => {
      if (discharging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      // Calculate cursor position fraction (0.0 to 1.0)
      const fraction = Math.max(0, Math.min(1, x / rect.width));
      
      // Determine which character index the mouse is hovering over
      // +1 ensures we show at least the character under the cursor
      let newTarget = Math.floor(fraction * text.length) + 1;
      newTarget = Math.max(1, Math.min(newTarget, text.length)); // Clamp
      
      setTargetIndex(newTarget);
      setIsHovered(true);
  };

  const handleMouseLeave = () => {
      setIsHovered(false);
      setTargetIndex(text.length); // Animate back to full text
  };

  return (
    <div 
        ref={containerRef}
        className="relative group cursor-default select-none flex items-center justify-start py-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
        {/* GHOST LAYER: Occupies space to keep layout stable */}
        <div className={cn(textStyles, "opacity-0 invisible")} aria-hidden="true">
            {text}
        </div>

        {/* VISIBLE LAYER */}
        <MotionDiv
            className={cn("absolute left-0 top-1/2 -translate-y-1/2 flex items-center z-10", textStyles)}
            style={{
                color: "hsl(var(--foreground))",
                textShadow: discharging ? `0 0 10px ${accentColor}` : `0 0 1px ${accentColor}40`
            }}
            animate={discharging 
                ? { x: [-1, 1, 0], skewX: [0, 2, 0] } 
                : { x: 0, skewX: 0 } 
            }
            transition={{ duration: 0.1 }}
        >
            {discharging ? scrambleText : text.slice(0, displayIndex)}
            
            {/* Blinking Cursor: Shows when interacting and not fully restored */}
            {(!discharging && isHovered) && (
                <span className="text-primary animate-pulse ml-0.5 inline-block">_</span>
            )}
        </MotionDiv>
        
        {/* Glow Layer */}
        <MotionDiv
            className={cn("absolute left-0 top-1/2 -translate-y-1/2 blur-[4px] pointer-events-none", textStyles)}
            style={{ color: accentColor }}
            animate={{ 
                opacity: discharging ? 0.6 : 0.05, 
                scale: discharging ? 1.05 : 1
            }}
        >
            {discharging ? scrambleText : text.slice(0, displayIndex)}
        </MotionDiv>
    </div>
  );
};

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
  const rightIslandRef = useRef<HTMLDivElement>(null); // Direct ref to the right container
  const [mobileSlots, setMobileSlots] = useState(0);

  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  const titleFontClass = getFontClass(settings.dashboardFont);
  const thirdColor = settings.cursorColor || '#daa520';
  const groupCols = settings.groupColumnCount || 2;
  
  // --- GAP LOGIC ---
  const gapSize = settings.headerGap ?? 40;
  // Mobile Cap: Max 50px, otherwise follows slider if lower than 50
  const mobileGap = Math.min(gapSize, 50);

  // Calculate Wave Position based on Gap (Centered relative to gap)
  const waveWidth = gapSize + 120;
  const waveLeft = -(gapSize + 60);
  const mobileWaveWidth = mobileGap + 120;
  const mobileWaveLeft = -(mobileGap + 60);
  
  const showWaves = settings.animations && (settings.showHeaderWaves ?? true);
  
  // --- INTELLIGENT SPACE DETECTION (V2: Direct Measurement) ---
  useEffect(() => {
    const calculateSpace = () => {
        if (!rightIslandRef.current) return;
        
        // Measure the ACTUAL rendered width of the right island
        // This accounts for the flexbox layout automatically
        const width = rightIslandRef.current.offsetWidth;
        
        // Mandatory Space Reservation:
        // Integrated Wifi (64px) + Settings (36px) + Gap (8px) + Padding/Margins
        // TOTAL SAFE MINIMUM: 130px
        const mandatoryWidth = 100;
        
        const availableSpace = width - mandatoryWidth;
        const buttonUnit = 42; // Approx width of one extra button
        
        const slots = Math.floor(availableSpace / buttonUnit);
        setMobileSlots(Math.max(0, slots));
    };

    // Initial check
    calculateSpace();

    // Observe changes on both islands to trigger recalculation if layout shifts
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

  // --- FLOATING ANIMATION VARIANTS (DECOUPLED) ---
  const islandVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.9 },
    // Static state when levitation is OFF
    visible: { 
        y: 0, 
        x: 0, 
        opacity: 1, 
        scale: 1, 
        transition: { type: "spring", stiffness: 300, damping: 20 } 
    },
    // 1. LEFT: Slow, mostly vertical with slight right drift
    floatLeft: { 
      y: [0, -3, 1, -2, 0], 
      x: [0, 1, 0, 1, 0],
      opacity: 1, 
      scale: 1,
      transition: { 
        y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        default: { duration: 0.5 }
      }
    },
    // 2. RIGHT (MAIN): Slower, mostly horizontal drift with slight bob
    floatRight: { 
      y: [0, 2, -1, 1, 0], 
      x: [0, -2, 1, -1, 0],
      opacity: 1, 
      scale: 1,
      transition: { 
        y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        default: { duration: 0.5 }
      }
    },
    // 3. WIFI (SMALL): Faster, erratic "hover" feel
    floatWifi: {
      y: [0, -2, 2, -1, 1, 0],
      x: [0, 1, -1, 1, -1, 0],
      opacity: 1,
      scale: 1,
      transition: {
        y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        default: { duration: 0.5 }
      }
    }
  };

  const logoVariants = {
    idle: { scale: 1, rotate: 0 },
    impact: {
      scale: [1, 1.3, 1.1, 1],
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4, ease: "backOut" }
    },
    charged: {
        scale: 1.1,
        x: [0, -1, 1, -1, 0],
        y: [0, 1, -1, 1, 0],
        transition: { 
            scale: { duration: 0.2 },
            x: { duration: 0.1, repeat: Infinity },
            y: { duration: 0.1, repeat: Infinity }
        }
    }
  };

  // LEFT ISLAND: Standard "cut corner" style
  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  
  // RIGHT ISLAND:
  // Now has a 20px slanted cut on the RIGHT side to interface with the WiFi module.
  // Top-Right is 100% width, Bottom-Right is (100% - 20px).
  const CLIP_RIGHT_MAIN = "polygon(24px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div 
        className="max-w-[1400px] mx-auto flex items-stretch justify-between relative pointer-events-auto h-[60px] md:h-[72px] gap-[var(--header-gap-mobile)] md:gap-[var(--header-gap)]"
        style={{ 
            '--header-gap': `${gapSize}px`,
            '--header-gap-mobile': `${mobileGap}px`
        } as React.CSSProperties}
      >
        {/* --- GLOBAL EFFECTS --- */}
        {cursorBolt && (
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-visible">
                <LightningBolt 
                    startX={cursorBolt.start.x} startY={cursorBolt.start.y} 
                    endX={cursorBolt.end.x} endY={cursorBolt.end.y}
                    viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
                    className="w-full h-full"
                    amplitude={40}
                    segments={12}
                    glowIntensity={4}
                    thickness={1}
                />
            </div>
        )}

        {/* --- LEFT ISLAND (Title & Logo) --- */}
        <MotionDiv
          ref={leftIslandRef}
          variants={islandVariants}
          initial="hidden"
          animate={(settings.floatingIslands ?? true) ? "floatLeft" : "visible"} // Toggle Animation
          className="relative drop-shadow-xl filter group z-30 shrink-0 w-fit max-w-[65vw]" 
        >
           <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_LEFT }} />
           <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_LEFT }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
           </div>
           
           {/* Content Container */}
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
                    
                    {/* System Version Label */}
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

        {/* --- RIGHT SECTION (Controls + Separated Wifi) --- */}
        <div className="flex items-stretch gap-0.5 md:gap-1 min-w-0 flex-1 justify-end">
            
            {/* 1. Main Control Island */}
            <MotionDiv
                ref={rightIslandRef} // ATTACHED REF FOR ACCURATE MEASUREMENT
                variants={islandVariants}
                initial="hidden"
                animate={(settings.floatingIslands ?? true) ? "floatRight" : "visible"} // Toggle Animation
                transition={{ delay: 0.1 }}
                className="relative drop-shadow-xl filter flex-1 z-20 max-w-full"
            >
                {showWaves && (
                    <>
                        {/* Mobile Wave: Visible only on mobile, uses mobileGap */}
                        <ElectricWaves 
                            color={settings.cursorColor || "#daa520"} 
                            width={mobileWaveWidth} 
                            left={mobileWaveLeft}
                            opacity={(settings.headerWaveOpacity ?? 90) / 100}
                            dynamicIntensity={settings.headerDynamicIntensity || false}
                            className="flex md:hidden" 
                        />
                        {/* Desktop Wave: Visible only on desktop, uses full gapSize */}
                        <ElectricWaves 
                            color={settings.cursorColor || "#daa520"} 
                            width={waveWidth} 
                            left={waveLeft}
                            opacity={(settings.headerWaveOpacity ?? 90) / 100}
                            dynamicIntensity={settings.headerDynamicIntensity || false}
                            className="hidden md:flex" 
                        />
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
                    {/* Group Column Layout Control */}
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

                {/* MOBILE CONTROLS (Intelligent Space Filling) */}
                <div className="flex md:hidden items-center justify-end gap-1.5 z-10 w-full h-full">
                    <AnimatePresence>
                            {/* Priority 3: Scheduler */}
                            {mobileSlots >= 3 && (
                                <MotionDiv 
                                    initial={{ width: 0, opacity: 0, scale: 0.5 }} 
                                    animate={{ width: 'auto', opacity: 1, scale: 1 }} 
                                    exit={{ width: 0, opacity: 0, scale: 0.5 }}
                                    className="overflow-hidden"
                                >
                                    <ControlButton onClick={handleOpenScheduler} icon={CalendarClock} title={t.scheduler} active={isSchedulerOpen} />
                                </MotionDiv>
                            )}

                            {/* Priority 2: Language */}
                            {mobileSlots >= 2 && (
                                <MotionDiv
                                    initial={{ width: 0, opacity: 0, scale: 0.5 }} 
                                    animate={{ width: 'auto', opacity: 1, scale: 1 }} 
                                    exit={{ width: 0, opacity: 0, scale: 0.5 }}
                                    className="overflow-hidden"
                                >
                                    <ControlButton onClick={toggleLanguage} label={settings.language === 'en' ? 'FA' : 'EN'} title={t.switch_lang} />
                                </MotionDiv>
                            )}

                            {/* Priority 1: Theme */}
                            {mobileSlots >= 1 && (
                                <MotionDiv
                                    initial={{ width: 0, opacity: 0, scale: 0.5 }} 
                                    animate={{ width: 'auto', opacity: 1, scale: 1 }} 
                                    exit={{ width: 0, opacity: 0, scale: 0.5 }}
                                    className="overflow-hidden"
                                >
                                    <ControlButton onClick={toggleTheme} icon={settings.theme === 'light' ? Moon : Sun} title={t.switch_env} />
                                </MotionDiv>
                            )}
                    </AnimatePresence>

                    {mobileSlots >= 1 && <div className="w-px h-5 bg-border/30 mx-0.5" />}

                    {/* Settings is the last item in the main block */}
                    <ControlButton onClick={handleOpenMenu} icon={Settings} variant="primary" className="border-primary/50" />
                </div>
                </div>
            </MotionDiv>

            {/* 2. The Separated "Glass" Wifi Module */}
            <MotionDiv
                variants={islandVariants}
                initial="hidden"
                animate={(settings.floatingIslands ?? true) ? "floatWifi" : "visible"} // Toggle Animation
                transition={{ delay: 0.2 }}
                className="relative z-20 shrink-0 drop-shadow-xl filter" 
            >
                <ConnectionStatus variant="glass" />
            </MotionDiv>

        </div>
      </div>
      
      {/* Desktop Scheduler Dialog */}
      <div className="hidden md:block">
        <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
      </div>
    </header>
  );
};

const ControlButton = ({ onClick, icon: Icon, label, title, active, variant = 'default', className }: any) => {
    return (
        <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={onClick}
            title={title}
            className={cn(
                "relative h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden group shrink-0",
                variant === 'primary' 
                    ? "bg-primary text-black border-primary shadow-[0_4px_0_rgb(var(--foreground))]"
                    : "bg-background hover:bg-secondary border-border hover:border-primary/50 text-muted-foreground hover:text-primary shadow-sm",
                active && "bg-primary/20 border-primary text-primary",
                className
            )}
        >
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative z-10">
                {Icon ? <Icon className={cn("w-[18px] h-[18px] md:w-5 md:h-5", variant === 'primary' ? 'stroke-[2.5px]' : 'stroke-2')} /> : <span className="font-black text-[10px] md:text-xs">{label}</span>}
            </div>
        </MotionButton>
    )
}
