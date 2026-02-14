
import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useConnection } from '../../lib/store/connection';
import { useSettingsStore } from '../../lib/store/settings';
import { cn } from '../../lib/utils';

interface ConnectionStatusProps {
    variant?: 'default' | 'integrated' | 'glass';
    className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ variant = 'default', className }) => {
  const { isConnected } = useConnection();
  const { settings } = useSettingsStore();

  // "Glass" Mode: Used as the separated end-cap of the header
  if (variant === 'glass' || variant === 'integrated') {
      // Shape: Angled Left (20px in at top), Straight Right/Chamfered
      // This matches the new CLIP_RIGHT_MAIN in Header.tsx which has a 20px slanted cut.
      const CLIP_SHAPE = "polygon(20px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";
      const activeColor = settings.cursorColor || '#daa520';

      return (
        <div 
            className={cn(
                "relative flex flex-col items-center justify-center h-full w-14 md:w-20 transition-all duration-500 group",
                className
            )}
            title={isConnected ? 'System Synced' : 'System Offline'}
        >
            {/* 
                LAYER 1: THE BORDER (Outer Shell)
                This layer sits at the bottom and acts as the border.
                Reduced blur from xl to md.
                Added transparency to active color.
            */}
            <div 
                className={cn(
                    "absolute inset-0 z-10 backdrop-blur-md transition-colors duration-500"
                )}
                style={{ 
                    clipPath: CLIP_SHAPE,
                    // If connected, use the active color with 20% opacity (Hex 33). 
                    // If not, use undefined (handled by inner div).
                    backgroundColor: isConnected ? `${activeColor}33` : undefined
                }} 
            >
                 {!isConnected && (
                    <div className="absolute inset-0 bg-border/40 dark:bg-white/5" />
                 )}
            </div>

            {/* 
                LAYER 2: THE INNER BACKGROUND (Content Container)
                This sits 2px inside the border.
                Reduced opacity from 90/95 to 60/50 for lighter feel.
                Reduced blur from 3xl to md.
            */}
            <div 
                className="absolute inset-[2px] z-20 bg-background/60 dark:bg-[#0c0c0e]/50 backdrop-blur-md overflow-hidden"
                style={{ clipPath: CLIP_SHAPE }}
            >
                {/* Optional: Inner Ambient Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30" />
            </div>

            {/* 
                LAYER 3: The "Data Scanner" Beam (Effect)
            */}
            {isConnected && (
                <div 
                    className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
                    style={{ clipPath: CLIP_SHAPE }}
                >
                    <div 
                        className="absolute left-0 right-0 h-[30%] w-full animate-[scan_3s_linear_infinite]"
                        style={{
                            background: `linear-gradient(to bottom, transparent, ${activeColor}10, ${activeColor}40, transparent)`,
                            opacity: 0.3
                        }}
                    />
                    {/* Subtle grid noise inside the glass */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>
            )}

            {/* Icon & Status Text - REDESIGNED FOR TECH LOOK */}
            <div className="relative z-40 flex flex-col items-center justify-center gap-0.5 ml-2 h-full py-1"> 
                {isConnected ? (
                    <>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            {/* Status LED */}
                            <div className="w-1.5 h-1.5 rounded-sm animate-pulse shadow-[0_0_5px_currentColor]" style={{ backgroundColor: activeColor }} />
                            <span className="text-[9px] font-mono font-bold tracking-widest text-foreground/80">NET</span>
                        </div>

                        <div className="relative">
                            <Wifi 
                                className="w-4 h-4 md:w-5 md:h-5 transition-all duration-300" 
                                style={{ 
                                    color: activeColor,
                                    filter: `drop-shadow(0 0 5px ${activeColor})` 
                                }}
                                strokeWidth={3} 
                            />
                        </div>
                        
                        {/* Technical Underline */}
                        <div className="w-6 h-[1px] mt-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" style={{ color: activeColor }} />
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-1 mb-0.5 opacity-50">
                            <div className="w-1.5 h-1.5 rounded-sm bg-destructive" />
                            <span className="text-[9px] font-mono font-bold tracking-widest text-destructive">ERR</span>
                        </div>
                        <WifiOff className="w-4 h-4 md:w-5 md:h-5 text-destructive opacity-80" strokeWidth={2.5} />
                    </>
                )}
            </div>
        </div>
      );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-xl border-2 transition-all shadow-md",
        isConnected 
          ? 'bg-background text-primary border-primary/50' 
          : 'bg-background text-destructive border-destructive/50',
        className
      )}
      title={isConnected ? 'System Synced' : 'System Offline'}
    >
      {isConnected ? (
        <Wifi className="w-[18px] h-[18px] md:w-5 md:h-5 animate-pulse" />
      ) : (
        <WifiOff className="w-[18px] h-[18px] md:w-5 md:h-5" />
      )}
    </div>
  );
};
