
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Hash } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';
import { useCursorStore } from '../../lib/store/cursorStore';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { useSoundFx } from '../../hooks/useSoundFx';

interface HeaderProps {
  onOpenMenu: () => void;
}

// Workaround for Framer Motion types compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionPath = motion.path as any;
const MotionSpan = motion.span as any;
const MotionSvg = motion.svg as any;
const MotionCircle = motion.circle as any;

// --- Helper: Generate Jagged Path Data (KEPT FOR TITLE SPARK) ---
const generateJaggedPath = (startX: number, startY: number, endX: number, endY: number, segments: number, amplitude: number) => {
    let d = `M ${startX} ${startY}`;
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        
        // Calculate perpendicular offset
        const offset = (Math.random() - 0.5) * amplitude;
        
        // For a horizontal-ish line, simple Y offset works best for lightning look
        const jitterX = (Math.random() - 0.5) * (amplitude / 3); // Reduced X jitter to keep forward momentum
        
        d += ` L ${x + jitterX} ${y + offset}`;
    }
    d += ` L ${endX} ${endY}`;
    return d;
};

// --- Helper: Generate Smooth Sine Wave Path (NEW FOR ISLAND CONNECTION) ---
const generateSinePath = (width: number, height: number, cycles: number, amplitude: number, phase: number) => {
    const points = 50; // Resolution
    let d = `M 0 ${height / 2}`;
    
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        // Math: Sine wave equation
        const y = (height / 2) + Math.sin((t * cycles * Math.PI * 2) + phase) * amplitude;
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- NEW Electric Connection Component (Harmonic Plasma Stream) ---
const ElectricConnection = React.memo(({ color }: { color: string }) => {
  return (
    <div className="absolute top-0 bottom-0 -left-6 w-12 flex items-center justify-center overflow-visible pointer-events-none z-0">
       <svg viewBox="0 0 100 40" className="w-[300%] h-full overflow-visible opacity-90" preserveAspectRatio="none">
          <defs>
            <linearGradient id="stream-fade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity="0" />
                <stop offset="20%" stopColor={color} stopOpacity="1" />
                <stop offset="80%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id="plasma-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>
          
          {/* Layer 1: The Core Data Stream (Fast straight dashed line) */}
          <MotionPath
             d="M 0 20 L 100 20"
             stroke={color}
             strokeWidth="1.5"
             strokeDasharray="4 6"
             fill="none"
             strokeOpacity="0.8"
             animate={{ strokeDashoffset: [-20, 0] }}
             transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Layer 2: The Hot Core (White center) */}
          <MotionPath
             d="M 0 20 L 100 20"
             stroke="white"
             strokeWidth="0.5"
             strokeDasharray="10 20"
             fill="none"
             strokeOpacity="0.9"
             animate={{ strokeDashoffset: [-30, 0] }}
             transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />

          {/* Layer 3: Upper Harmonic Wave (Sine) */}
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1"
             fill="none"
             filter="url(#plasma-glow)"
             animate={{ d: [
                 generateSinePath(100, 40, 1.5, 6, 0),
                 generateSinePath(100, 40, 1.5, 6, Math.PI * 2)
             ]}}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Layer 4: Lower Harmonic Wave (Cosine/Phase Shifted) */}
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1"
             fill="none"
             filter="url(#plasma-glow)"
             strokeOpacity="0.6"
             animate={{ d: [
                 generateSinePath(100, 40, 2, 8, Math.PI),
                 generateSinePath(100, 40, 2, 8, Math.PI + (Math.PI * 2))
             ]}}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Layer 5: Floating Particles */}
          <MotionCircle 
            r="1.5" 
            fill="white"
            filter="url(#plasma-glow)"
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ 
                cx: [0, 50, 100], 
                cy: [20, 14, 20], // Slight arc
                opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          />
           <MotionCircle 
            r="1" 
            fill={color}
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ 
                cx: [0, 50, 100], 
                cy: [20, 26, 20], // Inverse arc
                opacity: [0, 1, 0] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

       </svg>
    </div>
  )
});

// --- SPARK BOLT (For Title -> Logo interaction) ---
const SparkBolt = ({ active }: { active: boolean }) => {
    // We keep this JAGGED because the user likes it for the title spark
    const path1 = generateJaggedPath(100, 10, 0, 10, 8, 15);
    const path2 = generateJaggedPath(100, 10, 0, 10, 12, 10);
    const path3 = generateJaggedPath(100, 10, 0, 10, 6, 5);

    return (
        <div className="absolute top-1/2 left-8 right-0 -translate-y-1/2 h-20 pointer-events-none z-20 overflow-visible">
            <AnimatePresence>
                {active && (
                    <MotionSvg
                        viewBox="0 0 100 20"
                        className="w-full h-full overflow-visible"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <defs>
                            <filter id="bolt-glow-dense" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        
                        <MotionPath
                            d={path1}
                            stroke="hsl(var(--primary))"
                            strokeWidth="6"
                            strokeOpacity="0.2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#bolt-glow-dense)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.1, ease: "linear" }}
                        />

                        <MotionPath
                            d={path2}
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#bolt-glow-dense)"
                            initial={{ pathLength: 0, opacity: 0.5 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        />

                        <MotionPath
                            d={path3}
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        />

                        <MotionCircle cx="80" cy="10" r="1.5" fill="white" initial={{ opacity:0, cx:90 }} animate={{ opacity: [0,1,0], cx: 60, cy: 5 }} transition={{ duration: 0.3 }} />
                        <MotionCircle cx="50" cy="10" r="1" fill="hsl(var(--primary))" initial={{ opacity:0 }} animate={{ opacity: [0,1,0], cx: 40, cy: 15 }} transition={{ duration: 0.3, delay: 0.05 }} />
                        <MotionCircle cx="20" cy="10" r="1.5" fill="white" initial={{ opacity:0 }} animate={{ opacity: [0,1,0], cx: 10, cy: 2 }} transition={{ duration: 0.3, delay: 0.1 }} />
                    </MotionSvg>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- CURSOR DISCHARGE BOLT ---
const CursorDischargeBolt = ({ start, end }: { start: {x:number, y:number} | null, end: {x:number, y:number} | null }) => {
    if (!start || !end) return null;

    const path1 = generateJaggedPath(start.x, start.y, end.x, end.y, 8, 40);
    const path2 = generateJaggedPath(start.x, start.y, end.x, end.y, 12, 20);
    const path3 = generateJaggedPath(start.x, start.y, end.x, end.y, 6, 10);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-visible">
             <svg className="w-full h-full overflow-visible">
                <defs>
                    <filter id="cursor-bolt-glow-dense">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                
                <MotionPath
                    d={path1}
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeOpacity="0.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cursor-bolt-glow-dense)"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0] }}
                    transition={{ duration: 0.2, ease: "linear" }}
                />

                <MotionPath
                    d={path2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cursor-bolt-glow-dense)"
                    initial={{ pathLength: 0, opacity: 1, strokeWidth: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0], strokeWidth: [2, 5, 0] }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                />

                <MotionPath
                    d={path3}
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0] }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                />
             </svg>
        </div>
    )
}

// --- GLITCH TITLE COMPONENT ---
const GlitchTitle = ({ text, active, discharging }: { text: string, active: boolean, discharging: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const trigger = active && (isHovered || discharging);

  const baseClass = "text-sm md:text-lg font-black uppercase tracking-tighter leading-none text-foreground select-none relative inline-block transition-colors duration-100";

  return (
    <div 
        className="relative group cursor-default"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        <h1 className={cn(baseClass, "z-10 relative", discharging && "text-primary/50 mix-blend-hard-light")}>
            {text}
        </h1>

        <AnimatePresence>
            {trigger && (
                <>
                    <MotionSpan
                        className={cn(baseClass, "absolute top-0 left-0 text-red-500 opacity-70 z-0 mix-blend-screen")}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ 
                            x: [-2, 2, -1, 0], 
                            y: [1, -1, 0],
                            opacity: [0.8, 1, 0],
                            clipPath: ["inset(0 0 0 0)", "inset(10% 0 80% 0)", "inset(80% 0 10% 0)", "inset(0 0 0 0)"]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </MotionSpan>

                    <MotionSpan
                        className={cn(baseClass, "absolute top-0 left-0 text-blue-500 opacity-70 z-0 mix-blend-screen")}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ 
                            x: [2, -2, 1, 0], 
                            y: [-1, 1, 0],
                            opacity: [0.8, 1, 0],
                            clipPath: ["inset(0 0 0 0)", "inset(80% 0 5% 0)", "inset(10% 0 60% 0)", "inset(0 0 0 0)"]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </MotionSpan>
                </>
            )}
        </AnimatePresence>
    </div>
  );
};

// --- ANIMATED CLOCK COMPONENTS ---

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
  
  // Clock state split for animations
  const [timeParts, setTimeParts] = useState<{h: string[], m: string[], s: string[]}>({ h:['0','0'], m:['0','0'], s:['0','0'] });
  
  // --- SPARK SYSTEM STATE ---
  const [sparkState, setSparkState] = useState<'idle' | 'discharge' | 'impact'>('idle');
  
  // --- INTERACTIVE CHARGE STATE ---
  const [isLogoCharged, setIsLogoCharged] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const [cursorBolt, setCursorBolt] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  useEffect(() => {
    // Clock Logic
    const locale = 'en-US'; // Force EN for consistent digit animation, format manually for aesthetics
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

  // --- 1. THE "ALIVE" INTERVAL (Text -> Logo) ---
  useEffect(() => {
      if (!settings.animations) return;

      const loop = setInterval(() => {
          setSparkState('discharge');
          playSpark(); // Zip sound

          setTimeout(() => {
              setSparkState('impact');
              playCharge(); // Thud sound
              // LOGO GETS CHARGED HERE
              setIsLogoCharged(true);
              
              // Charge lasts for 3 seconds max, then dissipates if not touched
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

  // --- 2. THE INTERACTIVE DISCHARGE (Logo -> Cursor) ---
  useEffect(() => {
      if (!isLogoCharged || !logoRef.current) return;

      const handleMouseMove = (e: MouseEvent) => {
          if (!isLogoCharged) return; // Double check inside closure

          const rect = logoRef.current!.getBoundingClientRect();
          const logoCenterX = rect.left + rect.width / 2;
          const logoCenterY = rect.top + rect.height / 2;

          // Calculate distance
          const dist = Math.hypot(e.clientX - logoCenterX, e.clientY - logoCenterY);
          
          // Trigger threshold (e.g., 150px)
          if (dist < 150) {
              // FIRE THE BOLT!
              playSpark(); // Play zap sound again
              setCursorBolt({
                  start: { x: logoCenterX, y: logoCenterY },
                  end: { x: e.clientX, y: e.clientY }
              });
              
              // Remove charge from Logo immediately
              setIsLogoCharged(false);

              // CHARGE THE CURSOR
              setCharged(true);
              setTimeout(() => {
                  setCharged(false);
              }, 1500); // Cursor stays charged for 1.5s

              // Clear the visual bolt after animation
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

  // Logo Animation Variants
  const logoVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      filter: 'drop-shadow(0 0 0px rgba(218,165,32,0))',
      color: "hsl(var(--primary))",
    },
    impact: {
      scale: [1, 1.3, 1.1, 1], // Violent shake
      rotate: [0, -10, 10, 0],
      filter: [
          'drop-shadow(0 0 0px rgba(218,165,32,0))',
          'drop-shadow(0 0 20px rgba(255,255,255,0.9))', // Bright white flash
          'drop-shadow(0 0 10px rgba(218,165,32,0.5))'
      ],
      color: ["hsl(var(--primary))", "#ffffff", "hsl(var(--primary))"], 
      transition: { duration: 0.4, ease: "backOut" }
    },
    charged: {
        scale: [1, 1.05, 1],
        filter: 'drop-shadow(0 0 8px rgba(218,165,32,0.8))', // Steady Glow
        transition: { duration: 1, repeat: Infinity, repeatType: "reverse" }
    }
  };

  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  const CLIP_RIGHT = "polygon(24px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex items-stretch justify-between gap-2 md:gap-4 relative pointer-events-auto h-[60px] md:h-[72px]">
        
        {/* === VISUAL FX LAYER === */}
        {cursorBolt && <CursorDischargeBolt start={cursorBolt.start} end={cursorBolt.end} />}

        {/* === ISLAND 1: IDENTITY (Spark System) === */}
        <MotionDiv
          variants={islandVariants}
          initial="hidden"
          animate="visible"
          className="relative min-w-[180px] md:min-w-[280px] drop-shadow-xl filter group" 
        >
           {/* Border & Background Layers */}
           <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_LEFT }} />
           <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_LEFT }}>
              {/* Optional: Subtle scanning line in background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
           </div>

           {/* Content */}
           <div className="relative h-full w-full flex items-center pl-6 pr-10 md:pl-8 md:pr-14">
              <div className="flex items-center gap-3 md:gap-4 z-10 relative w-full">
                  
                  {/* LOGO: The Target of the Spark */}
                  <div ref={logoRef} className="relative z-30">
                    <MotionDiv 
                        className="bg-background border-2 border-primary p-1.5 md:p-2 rounded-xl cursor-pointer"
                        animate={sparkState === 'impact' ? 'impact' : (isLogoCharged ? 'charged' : 'idle')}
                        variants={logoVariants}
                        style={{ borderColor: sparkState === 'impact' ? 'white' : '' }} 
                    >
                        <Zap className="w-4 h-4 md:w-6 md:h-6 fill-current transition-colors" strokeWidth={0} />
                    </MotionDiv>
                  </div>
                  
                  {/* SPARK ANIMATION: Bridges the gap (Absolute to avoid layout shift) */}
                  <SparkBolt active={sparkState === 'discharge'} />

                  <div className="flex flex-col justify-center gap-0.5 relative z-30">
                    <div className="flex items-center gap-2">
                        <div className="p-0.5 bg-primary/20 rounded-sm">
                            <Hash size={10} className="text-primary" strokeWidth={3} />
                        </div>
                        {/* TEXT: The Source of the Spark */}
                        <GlitchTitle 
                            text={settings.title} 
                            active={settings.animations} 
                            discharging={sparkState === 'discharge'} 
                        />
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1.5 mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                      <span className={cn("w-1.5 h-1.5 rounded-sm transition-colors", sparkState === 'impact' ? "bg-white shadow-[0_0_5px_white]" : "bg-primary")} /> 
                      {t.node_controller}
                    </div>
                  </div>
              </div>
           </div>
        </MotionDiv>
        
        {/* === ISLAND 2: COMMAND CENTER === */}
        <MotionDiv
            variants={islandVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="relative flex-1 drop-shadow-xl filter"
        >
            {/* NEW HARMONIC CONNECTION: Island-to-Island */}
            <ElectricConnection color={settings.cursorColor || "#daa520"} />

            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_RIGHT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_RIGHT }}>
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
            </div>

            <div className="relative h-full w-full flex items-center justify-between pl-10 pr-6 md:pl-14 md:pr-8">
               <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-auto py-1">
                  
                  {/* NEW ANIMATED CLOCK CONTAINER */}
                  <MotionDiv 
                    whileHover={{ scale: 1.05 }}
                    className="group relative px-2 py-1 rounded-lg border border-transparent hover:border-primary/30 transition-all duration-300 cursor-default overflow-hidden"
                  >
                      {/* Removed background glow div, using text-clip instead */}
                      
                      {/* FORCE LTR FOR CLOCK DISPLAY TO FIX RTL BUG */}
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

// --- Custom "Charged" Button Component ---
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
