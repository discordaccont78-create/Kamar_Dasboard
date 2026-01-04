
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, Terminal, CalendarClock, Activity } from 'lucide-react';
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

// --- Electric Connection Component ---
const ElectricConnection = React.memo(({ color }: { color: string }) => {
  // Generates a jagged electric path
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
          
          {/* Main Bolt: Flows Left to Right */}
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
                pathLength: [0, 1.2, 1.2], // Draw completely
                opacity: [0, 1, 0],       // Fade in/out
                pathOffset: [0, 0, 1]     // Move along
             }}
             transition={{
                duration: 2, // Cycle every 2 seconds
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 1] // Fast attack, slow decay
             }}
          />
          
          {/* Secondary Chaotic Sparks */}
          <MotionPath 
             d="M10,50 L30,60 L50,40 L70,55 L90,50"
             stroke={color}
             strokeWidth="1"
             fill="none"
             opacity="0.6"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.8, 0]
             }}
             transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: "linear"
             }}
          />
       </svg>
    </div>
  )
});

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [time, setTime] = useState<string>('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const { playClick, playToggle } = useSoundFx();
  
  const t = translations[settings.language];

  useEffect(() => {
    const locale = settings.language === 'fa' ? 'fa-IR' : 'en-US';
    setTime(new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

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

  // --- ANIMATION VARIANTS ---
  const islandVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.9 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20, 
        mass: 1.5
      }
    }
  };

  const logoInnerVariants = {
    idle: {
      scale: [1, 1.2, 1],
      opacity: [0.8, 1, 0.8],
      filter: [
        'drop-shadow(0 0 0px rgba(218,165,32,0))',
        'drop-shadow(0 0 10px rgba(218,165,32,0.8))',
        'drop-shadow(0 0 0px rgba(218,165,32,0))'
      ],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    hover: {
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.2 }
    }
  };

  // --- POLYGON DEFINITIONS FOR HIGH-TECH SHAPES ---
  // Left Island: Chamfered Left corners, Straight Right Top, Slanted Right Bottom
  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  
  // Right Island: Slanted Left Top, Straight Right Top, Chamfered Right corners
  const CLIP_RIGHT = "polygon(24px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex items-stretch justify-between gap-2 md:gap-4 relative pointer-events-auto h-[60px] md:h-[72px]">
        
        {/* === ISLAND 1: IDENTITY === */}
        <MotionDiv
          variants={islandVariants}
          initial="hidden"
          animate="visible"
          className="relative min-w-[180px] md:min-w-[280px] drop-shadow-xl filter" 
        >
           {/* 1. Border Layer (Outer) */}
           <div 
             className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl"
             style={{ clipPath: CLIP_LEFT }}
           />
           
           {/* 2. Background Layer (Inner - inset to reveal border) */}
           <div 
             className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden"
             style={{ clipPath: CLIP_LEFT }}
           >
              {/* Spark Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
           </div>

           {/* 3. Content Layer (Not Clipped, just safely padded) */}
           <div className="relative h-full w-full flex items-center pl-6 pr-10 md:pl-8 md:pr-14">
              <div className="flex items-center gap-3 md:gap-4 z-10">
                  <MotionDiv 
                    className="bg-background border-2 border-primary p-1.5 md:p-2 rounded-xl shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)] cursor-pointer"
                    whileHover="hover"
                    initial="idle"
                    animate="idle"
                  >
                    <MotionDiv variants={logoInnerVariants}>
                      <Zap className="text-primary w-4 h-4 md:w-6 md:h-6 fill-current" strokeWidth={0} />
                    </MotionDiv>
                  </MotionDiv>
                  
                  <div className="flex flex-col justify-center">
                    <h1 className={cn(
                      "text-sm md:text-lg font-black uppercase tracking-tighter leading-none text-foreground flex items-center gap-1",
                      settings.animations && "text-shimmer"
                    )}>
                      <Activity size={12} className="text-primary animate-pulse" />
                      {settings.title}
                    </h1>
                    <div className="hidden md:flex items-center gap-1.5 mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
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
            {/* ELECTRIC CONNECTION EFFECT (BRIDGING THE GAP) */}
            <ElectricConnection color={settings.cursorColor || "#daa520"} />

            {/* 1. Border Layer */}
            <div 
             className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl"
             style={{ clipPath: CLIP_RIGHT }}
            />

            {/* 2. Background Layer */}
            <div 
             className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden"
             style={{ clipPath: CLIP_RIGHT }}
            >
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
            </div>

            {/* 3. Content Layer */}
            <div className="relative h-full w-full flex items-center justify-between pl-10 pr-6 md:pl-14 md:pr-8">
               {/* Center: Digital Clock */}
               <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-10">
                  <div className={cn(
                      "font-dina text-2xl font-bold tracking-widest flex items-center gap-2",
                      "text-foreground drop-shadow-sm"
                  )}>
                    {time || "00:00:00"}
                  </div>
                  <div className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/70">{t.system_time}</div>
               </div>

               {/* Right: Controls */}
               <div className="flex items-center gap-2 md:gap-3 z-10 ml-auto">
                  <ControlButton 
                    onClick={handleOpenScheduler} 
                    icon={CalendarClock} 
                    title={t.scheduler}
                    active={isSchedulerOpen}
                  />

                  <div className="w-px h-8 bg-border/40 mx-1 hidden sm:block" />

                  <ControlButton 
                    onClick={toggleTheme} 
                    icon={settings.theme === 'light' ? Moon : Sun} 
                    title={t.switch_env}
                  />

                  <ControlButton 
                    onClick={toggleLanguage} 
                    label={settings.language === 'en' ? 'FA' : 'EN'}
                    title={t.switch_lang}
                  />
                  
                  <ControlButton 
                    onClick={handleOpenMenu}
                    icon={Settings}
                    title={t.sys_config}
                    variant="primary"
                  />
                  
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
            {/* Electric Hover Fill */}
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            <div className="relative z-10">
                {Icon ? <Icon size={20} strokeWidth={variant === 'primary' ? 2.5 : 2} /> : <span className="font-black text-xs">{label}</span>}
            </div>
        </MotionButton>
    )
}
