
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Terminal } from 'lucide-react';
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

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { setCharged } = useCursorStore();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
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
                <ElectricWaves 
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
               <DigitalClock />
               
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
