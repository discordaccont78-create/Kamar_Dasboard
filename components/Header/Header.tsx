
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Hash, Terminal } from 'lucide-react';
import { useSettingsStore } from '../../lib/store/settings';
import { useCursorStore } from '../../lib/store/cursorStore';
import { useSoundFx } from '../../hooks/useSoundFx';
import { cn, getFontClass } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';
import { ConnectionStatus } from './ConnectionStatus';
import { LightningBolt } from '../Effects/LightningBolt';

// Motion Components Definitions to fix "Cannot find name" errors
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;
const MotionButton = motion.button as any;
const MotionPath = motion.path as any;
const MotionRect = motion.rect as any;
const MotionCircle = motion.circle as any;

interface HeaderProps {
    onOpenMenu: () => void;
}

// --- Helper: Generate Smooth Sine Wave Path ---
const generateSinePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 100; // Resolution
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        const y = yCenter + Math.sin(theta) * amplitude;
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- Helper: Generate Soft Square Wave Path ---
const generateSquarePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 200; 
    let d = `M 0 ${yCenter}`;
    
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        const val = Math.tanh(Math.sin(theta) * 5);
        const y = yCenter - (val * amplitude); 
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- Helper: Generate Sawtooth Wave Path ---
const generateSawtoothPath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 100;
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const rawPhase = ((t * cycles) + (phaseOffset / (Math.PI * 2))) % 1;
        const ramp = (rawPhase < 0 ? 1 + rawPhase : rawPhase) * 2 - 1;
        const y = yCenter - (ramp * amplitude);
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- Electric Connection Component ---
const ElectricConnection = React.memo(({ color, width, left, opacity, dynamicIntensity }: { color: string, width: number, left: number, opacity: number, dynamicIntensity: boolean }) => {
  const PHASE_SHIFT = (2 * Math.PI) / 3;

  const squareWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.6;
      const cycles = 4;
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSquarePath(100, 5, cycles, 3, phase));
          
          if (dynamicIntensity) {
              const cosVal = Math.cos(phase);
              const proximity = (cosVal + 1) / 2;
              const intensity = Math.pow(proximity, 24);
              opacities.push(baseOpacity + (intensity * 0.4)); 
              widths.push(1 + (intensity * 1.2)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(1);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  const sineWaveData = useMemo(() => {
      const framesA = [];
      const framesB = [];
      const framesC = [];
      const opacityA = [];
      const opacityB = [];
      const opacityC = [];
      const steps = 60;
      const baseOpacity = 0.6;
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const movePhase = -Math.PI * 2 * progress; 
          const stableAmp = 8; 

          framesA.push(generateSinePath(100, 20, 2, stableAmp, movePhase));
          framesB.push(generateSinePath(100, 20, 2, stableAmp, movePhase + PHASE_SHIFT));
          framesC.push(generateSinePath(100, 20, 2, stableAmp, movePhase + (PHASE_SHIFT * 2)));

          if (dynamicIntensity) {
              const centerT = 0.5;
              const theta = (centerT * 2 * Math.PI * 2) + movePhase;
              const calcOpacity = (offset: number) => {
                  const val = Math.sin(theta + offset);
                  const peakProximity = Math.pow(Math.abs(val), 3);
                  return baseOpacity + (peakProximity * 0.4); 
              };
              opacityA.push(calcOpacity(0));
              opacityB.push(calcOpacity(PHASE_SHIFT));
              opacityC.push(calcOpacity(PHASE_SHIFT * 2));
          } else {
              opacityA.push(baseOpacity);
              opacityB.push(baseOpacity);
              opacityC.push(baseOpacity);
          }
      }
      return { 
          frames: { A: framesA, B: framesB, C: framesC },
          opacities: { A: opacityA, B: opacityB, C: opacityC }
      };
  }, [dynamicIntensity]);

  const sawtoothWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.4;
      const cycles = 3; 

      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSawtoothPath(100, 35, cycles, 3, phase));

          if (dynamicIntensity) {
              const phaseNorm = phase / (Math.PI * 2);
              const rawPos = (0.5 * cycles) + phaseNorm;
              const dist = Math.abs(rawPos - Math.round(rawPos)); 
              const proximity = 1 - (dist * 2);
              const intensity = Math.pow(proximity, 24);
              opacities.push(baseOpacity + (intensity * 0.6));
              widths.push(0.8 + (intensity * 1.0)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(0.8);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  return (
    <div 
      className="absolute top-0 bottom-0 flex items-center justify-center overflow-visible pointer-events-none z-0"
      style={{
          left: `${left}px`,
          width: `${width}px`,
          opacity: opacity
      }}
    >
       <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="stream-fade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity="0" />
                <stop offset="15%" stopColor={color} stopOpacity="0.8" />
                <stop offset="85%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id="plasma-glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>
          
          <MotionPath
             d="M 0 20 L 100 20"
             stroke={color}
             strokeWidth="1"
             strokeDasharray="3 5"
             fill="none"
             strokeOpacity="0.1"
             animate={{ strokeDashoffset: [-16, 0] }}
             transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          />

          <path d="M 0 5 L 100 5" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="1 2" />
          <MotionPath
             stroke={color}
             strokeWidth={squareWaveData.widths}
             fill="none"
             strokeOpacity={squareWaveData.opacities}
             animate={{ d: squareWaveData.frames, strokeOpacity: squareWaveData.opacities, strokeWidth: squareWaveData.widths }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <MotionRect
            width="2"
            height="2"
            fill={color}
            initial={{ x: 0, y: 4, opacity: 0 }}
            animate={{ x: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          <MotionPath
             stroke={color}
             strokeWidth={sawtoothWaveData.widths}
             fill="none"
             strokeOpacity={sawtoothWaveData.opacities}
             animate={{ d: sawtoothWaveData.frames, strokeOpacity: sawtoothWaveData.opacities, strokeWidth: sawtoothWaveData.widths }}
             transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <MotionCircle 
            r="1.2" 
            fill={color}
            initial={{ cx: 0, cy: 35, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
           <MotionCircle 
            r="0.8" 
            fill="white"
            initial={{ cx: 0, cy: 35, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.25 }}
          />

          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.A}
             animate={{ d: sineWaveData.frames.A, strokeOpacity: sineWaveData.opacities.A }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.B}
             animate={{ d: sineWaveData.frames.B, strokeOpacity: sineWaveData.opacities.B }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.C}
             animate={{ d: sineWaveData.frames.C, strokeOpacity: sineWaveData.opacities.C }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          <MotionCircle 
            r="1.5" 
            fill="white"
            filter="url(#plasma-glow)"
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
           <MotionCircle 
            r="1" 
            fill={color}
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />
       </svg>
    </div>
  )
});

// --- UPDATED TITLE COMPONENT: PURE SOLID TEXT ---
const DynamicTitle = ({ 
    text, 
    fontClass, 
    discharging, 
    accentColor, 
    strokeColor 
}: { 
    text: string, 
    fontClass: string, 
    discharging: boolean, 
    accentColor: string,
    strokeColor: string
}) => {
  return (
    <div className="relative group cursor-default select-none flex items-center">
        {/* 
            STEP 1: CLEAN SOLID TEXT
            - Idle: Solid Foreground Color (No Strokes, No Transparency)
            - Discharging: Solid Accent Color + Scale Animation
        */}
        <MotionDiv
            className={cn(
                "text-xl md:text-3xl font-black uppercase tracking-[0.15em] leading-none transition-all duration-300 relative z-10",
                fontClass
            )}
            style={{
                color: discharging ? accentColor : "hsl(var(--foreground))",
            }}
            animate={discharging 
                ? { scale: 1.05 } 
                : { scale: 1 } 
            }
        >
            {text}
        </MotionDiv>
    </div>
  );
};

const TimeDigit = ({ val }: { val: string }) => (
  <div className="relative h-6 w-3.5 md:h-8 md:w-5 overflow-hidden flex items-center justify-center">
    <AnimatePresence mode="popLayout">
      <MotionSpan
        key={val}
        initial={{ y: -10, opacity: 0, filter: 'blur(2px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 10, opacity: 0, filter: 'blur(2px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center font-dina text-lg md:text-xl font-bold leading-none pb-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--foreground))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
      >
        {val}
      </MotionSpan>
    </AnimatePresence>
  </div>
);

const Separator = () => (
  <MotionSpan 
    animate={{ opacity: [0.3, 1, 0.3] }} 
    transition={{ duration: 1, repeat: Infinity }}
    className="font-dina text-lg md:text-xl font-bold mx-px -mt-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--primary))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
  >
    :
  </MotionSpan>
);

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { setCharged } = useCursorStore();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const [timeParts, setTimeParts] = useState<{h: string[], m: string[], s: string[]}>({ h:['0','0'], m:['0','0'], s:['0','0'] });
  const [sparkState, setSparkState] = useState<'idle' | 'discharge' | 'impact'>('idle');
  const [isLogoCharged, setIsLogoCharged] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const [cursorBolt, setCursorBolt] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  // Dynamic font class based on settings
  const titleFontClass = getFontClass(settings.dashboardFont);
  // Get 3rd color (Cursor Color) for the title accent
  const thirdColor = settings.cursorColor || '#daa520';
  
  // Calculate Stroke Color based on Theme (Opposite)
  const strokeColor = settings.theme === 'dark' ? '#ffffff' : '#000000';

  const gapSize = settings.headerGap ?? 160;
  const waveWidth = gapSize + 120;
  const waveLeft = -(gapSize + 60);

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0').split('');
        const m = now.getMinutes().toString().padStart(2, '0').split('');
        const s = now.getSeconds().toString().padStart(2, '0').split('');
        setTimeParts({ h, m, s });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      }, 6000); 
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

  const islandVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.9 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20, mass: 1.5 }
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

  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  const CLIP_RIGHT = "polygon(24px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div 
        className="max-w-[1400px] mx-auto flex items-stretch justify-between relative pointer-events-auto h-[60px] md:h-[72px]"
        style={{ gap: `${gapSize}px` }}
      >
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
        <MotionDiv
          variants={islandVariants}
          initial="hidden"
          animate="visible"
          className="relative min-w-[200px] md:min-w-[320px] drop-shadow-xl filter group z-30" 
        >
           <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_LEFT }} />
           <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_LEFT }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
           </div>
           <div className="relative h-full w-full flex items-center pl-6 pr-10 md:pl-8 md:pr-14">
              <div className="flex items-center gap-4 md:gap-5 z-10 relative w-full">
                  <div ref={logoRef} className="relative z-30 group flex items-center justify-center">
                    
                    <MotionDiv 
                        className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center cursor-pointer"
                        animate={sparkState === 'impact' ? 'impact' : (isLogoCharged ? 'charged' : 'idle')}
                        variants={logoVariants}
                    >
                        <Zap 
                            className="absolute inset-0 w-full h-full text-primary/20" 
                            strokeWidth={1} 
                        />

                        <MotionDiv
                            className="absolute inset-0 w-full h-full overflow-hidden"
                            initial={{ clipPath: "inset(100% 0 0 0)" }}
                            animate={{
                                clipPath: (isLogoCharged || sparkState === 'impact') 
                                    ? "inset(0% 0 0 0)" 
                                    : "inset(100% 0 0 0)",
                                filter: sparkState === 'impact' ? "brightness(1.5)" : "brightness(1)"
                            }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        >
                             <Zap 
                                className="w-full h-full text-primary fill-current drop-shadow-[0_0_15px_rgba(218,165,32,0.6)]" 
                                strokeWidth={0} 
                             />
                        </MotionDiv>
                    </MotionDiv>
                  </div>
                  
                  <div className="absolute top-1/2 left-8 right-0 -translate-y-1/2 h-12 pointer-events-none z-20">
                      <LightningBolt 
                          active={sparkState === 'discharge'} 
                          startX={100} endX={0} 
                          startY={10} endY={10} 
                          segments={20} 
                          amplitude={3}
                          glowIntensity={1}
                          thickness={0.6}
                          viewBox="0 0 100 20"
                          className="opacity-90"
                      />
                  </div>

                  <div className="flex flex-col justify-center gap-1 relative z-30">
                    <DynamicTitle 
                        text={settings.title} 
                        fontClass={titleFontClass}
                        discharging={sparkState === 'discharge'} 
                        accentColor={thirdColor}
                        strokeColor={strokeColor}
                    />
                    
                    {/* Updated Technical Sub-Label */}
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-sm transition-all duration-300", 
                            sparkState === 'impact' ? "bg-white shadow-[0_0_8px_white]" : "bg-primary"
                        )} /> 
                        <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
                            <span className="opacity-50">SYS.VER</span>
                            <span className="text-primary">3.1</span>
                            <span className="w-px h-2 bg-border/50 mx-0.5" />
                            <Terminal size={8} />
                            <span>NODE_CTRL</span>
                        </div>
                    </div>
                  </div>
              </div>
           </div>
        </MotionDiv>
        <MotionDiv
            variants={islandVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="relative flex-1 drop-shadow-xl filter"
        >
            {settings.animations && (
                <ElectricConnection 
                    color={settings.cursorColor || "#daa520"} 
                    width={waveWidth} 
                    left={waveLeft}
                    opacity={(settings.headerWaveOpacity ?? 90) / 100}
                    dynamicIntensity={settings.headerDynamicIntensity || false}
                />
            )}
            
            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_RIGHT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_RIGHT }}>
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
            </div>
            <div className="relative h-full w-full flex items-center justify-between pl-10 pr-6 md:pl-14 md:pr-8">
               <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-auto py-1">
                  <MotionDiv 
                    whileHover={{ scale: 1.05 }}
                    className="group relative px-2 py-1 rounded-lg border border-transparent hover:border-primary/30 transition-all duration-300 cursor-default overflow-hidden"
                  >
                      <div className="relative z-10 flex items-center gap-0.5 md:gap-1 drop-shadow-sm select-none" dir="ltr">
                          <TimeDigit val={timeParts.h[0]} />
                          <TimeDigit val={timeParts.h[1]} />
                          <Separator />
                          <TimeDigit val={timeParts.m[0]} />
                          <TimeDigit val={timeParts.m[1]} />
                          <Separator />
                          <TimeDigit val={timeParts.s[0]} />
                          <TimeDigit val={timeParts.s[1]} />
                      </div>
                  </MotionDiv>
                  <div className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/70 mt-0.5 ml-3">{t.system_time}</div>
               </div>
               <div className="flex items-center gap-2 md:gap-3 z-10 ml-auto">
                  <ControlButton onClick={handleOpenScheduler} icon={CalendarClock} title={t.scheduler} active={isSchedulerOpen} />
                  <div className="w-px h-8 bg-border/40 mx-1 hidden sm:block" />
                  <ControlButton onClick={toggleTheme} icon={settings.theme === 'light' ? Moon : Sun} title={t.switch_env} />
                  <ControlButton onClick={toggleLanguage} label={settings.language === 'en' ? 'FA' : 'EN'} title={t.switch_lang} />
                  <ControlButton onClick={handleOpenMenu} icon={Settings} title={t.sys_config} variant="primary" />
                  <div className="hidden sm:block pl-2 border-l-2 border-border/30">
                    <ConnectionStatus />
                  </div>
               </div>
            </div>
        </MotionDiv>
      </div>
      <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </header>
  );
};

const ControlButton = ({ onClick, icon: Icon, label, title, active, variant = 'default' }: any) => {
    return (
        <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={onClick}
            title={title}
            className={cn(
                "relative h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden group",
                variant === 'primary' 
                    ? "bg-primary text-black border-primary shadow-[0_4px_0_rgb(var(--foreground))]"
                    : "bg-background hover:bg-secondary border-border hover:border-primary/50 text-muted-foreground hover:text-primary shadow-sm",
                active && "bg-primary/20 border-primary text-primary"
            )}
        >
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative z-10">
                {Icon ? <Icon size={20} strokeWidth={variant === 'primary' ? 2.5 : 2} /> : <span className="font-black text-xs">{label}</span>}
            </div>
        </MotionButton>
    )
}
