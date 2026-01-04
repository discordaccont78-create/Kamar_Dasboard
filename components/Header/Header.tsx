import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, Terminal, CalendarClock, Activity, Hash, Monitor } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';
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

// --- Electric Connection Component (Static Decoration) ---
const ElectricConnection = React.memo(({ color }: { color: string }) => {
  return (
    <div className="absolute top-0 bottom-0 -left-3 md:-left-5 w-4 md:w-6 flex items-center justify-center overflow-visible pointer-events-none z-50">
       <svg viewBox="0 0 100 100" className="w-[250%] h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <MotionPath 
             d="M0,50 L20,30 L40,70 L60,20 L80,60 L100,50"
             stroke={color}
             strokeWidth="3"
             fill="none"
             strokeLinecap="round"
             strokeLinejoin="round"
             filter="url(#glow)"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ 
                pathLength: [0, 1.2, 1.2],
                opacity: [0, 1, 0],
                pathOffset: [0, 0, 1]
             }}
             transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 1]
             }}
          />
       </svg>
    </div>
  )
});

// --- SPARK BOLT: The arc jumping from Text to Logo ---
const SparkBolt = ({ active }: { active: boolean }) => {
    return (
        <div className="absolute top-1/2 left-8 right-0 -translate-y-1/2 h-8 pointer-events-none z-20 overflow-visible">
            <AnimatePresence>
                {active && (
                    <MotionSvg
                        viewBox="0 0 100 20"
                        className="w-full h-full overflow-visible"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <defs>
                            <filter id="bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* The Bolt Path: Moves Right to Left (Text to Logo) */}
                        <MotionPath
                            d="M 100 10 L 80 5 L 60 15 L 40 2 L 20 12 L 0 10"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#bolt-glow)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ 
                                pathLength: [0, 1], 
                                opacity: [0, 1, 0],
                                strokeWidth: [1, 3, 0]
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                        {/* Secondary Sparkles */}
                        <MotionPath
                            d="M 90 10 L 85 15 M 50 10 L 45 5"
                            stroke="white"
                            strokeWidth="1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                        />
                    </MotionSvg>
                )}
            </AnimatePresence>
        </div>
    );
};

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
        {/* Main Text - Flash White on Discharge */}
        <h1 className={cn(baseClass, "z-10 relative", discharging && "text-primary/50 mix-blend-hard-light")}>
            {text}
        </h1>

        {/* RGB Split Layers */}
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


export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [time, setTime] = useState<string>('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  // --- SPARK SYSTEM STATE ---
  // 'idle': nothing happening
  // 'discharge': text flashes, spark flies
  // 'impact': spark hits logo, logo glows
  const [sparkState, setSparkState] = useState<'idle' | 'discharge' | 'impact'>('idle');

  // Import new sound effects
  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  useEffect(() => {
    // Clock
    const locale = settings.language === 'fa' ? 'fa-IR' : 'en-US';
    const updateTime = () => setTime(new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

  // --- THE "ALIVE" INTERVAL ---
  useEffect(() => {
      if (!settings.animations) return;

      const loop = setInterval(() => {
          // 1. Start Discharge (Text Flash + Spark Travel)
          setSparkState('discharge');
          playSpark(); // Sound 1: Electric Zip

          // 2. Impact (Spark hits Logo) - 250ms later (sync with spark duration)
          setTimeout(() => {
              setSparkState('impact');
              playCharge(); // Sound 2: Deep Thud/Absorb
          }, 250);

          // 3. Reset to Idle - 500ms after impact
          setTimeout(() => {
              setSparkState('idle');
          }, 750);

      }, 6000); // Happens every 6 seconds

      return () => clearInterval(loop);
  }, [settings.animations, playSpark, playCharge]);

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

  // Logo Animation Variants depending on Spark State
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
      color: ["hsl(var(--primary))", "#ffffff", "hsl(var(--primary))"], // Flash white
      transition: { duration: 0.4, ease: "backOut" }
    }
  };

  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  const CLIP_RIGHT = "polygon(24px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex items-stretch justify-between gap-2 md:gap-4 relative pointer-events-auto h-[60px] md:h-[72px]">
        
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
                  <MotionDiv 
                    className="bg-background border-2 border-primary p-1.5 md:p-2 rounded-xl cursor-pointer relative z-30"
                    animate={sparkState === 'impact' ? 'impact' : 'idle'}
                    variants={logoVariants}
                    style={{ borderColor: sparkState === 'impact' ? 'white' : '' }} // Flash border too
                  >
                    <Zap className="w-4 h-4 md:w-6 md:h-6 fill-current transition-colors" strokeWidth={0} />
                  </MotionDiv>
                  
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
            <ElectricConnection color={settings.cursorColor || "#daa520"} />

            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_RIGHT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_RIGHT }}>
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
            </div>

            <div className="relative h-full w-full flex items-center justify-between pl-10 pr-6 md:pl-14 md:pr-8">
               <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-10">
                  <div className={cn("font-dina text-2xl font-bold tracking-widest flex items-center gap-2", "text-foreground drop-shadow-sm")}>
                    {time || "00:00:00"}
                  </div>
                  <div className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/70">{t.system_time}</div>
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