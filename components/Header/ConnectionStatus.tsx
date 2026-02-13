
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '../../lib/store/connection';
import { cn } from '../../lib/utils';

interface ConnectionStatusProps {
    variant?: 'default' | 'integrated' | 'glass';
    className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ variant = 'default', className }) => {
  const { isConnected } = useConnection();

  // "Glass" Mode: Used as the separated end-cap of the header
  if (variant === 'glass' || variant === 'integrated') {
      // Shape: Straight on Left (to merge), Chamfered on Right (to end header)
      const CLIP_SHAPE = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

      return (
        <div 
            className={cn(
                "relative flex flex-col items-center justify-center h-full w-14 md:w-20 transition-all duration-500 group",
                className
            )}
            title={isConnected ? 'System Synced' : 'System Offline'}
        >
            {/* 
                THE BORDER LAYER (HOLLOW)
                We use mask-composite to create a true transparent center.
                Background color here applies ONLY to the border stroke.
            */}
            <div 
                className="absolute inset-0 bg-border/60 dark:bg-white/20 z-20 pointer-events-none transition-colors duration-300"
                style={{ 
                    clipPath: CLIP_SHAPE,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '2px', // Border Thickness
                    paddingLeft: '0px' // Remove left border to merge visually with main island
                }} 
            />

            {/* Scanline Effect (Active State) - Subtle on top of transparent */}
            {isConnected && (
                <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-[scan_4s_linear_infinite] h-[200%] w-full -translate-y-1/2 pointer-events-none z-10 opacity-20"
                    style={{ clipPath: CLIP_SHAPE }}
                />
            )}

            {/* Icon & Status Dots */}
            <div className="relative z-30 flex flex-col items-center gap-1">
                {isConnected ? (
                    <>
                        <Wifi className="w-5 h-5 md:w-6 md:h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" strokeWidth={2.5} />
                        {/* Hardware Signal LEDs */}
                        <div className="flex gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--primary)] animate-[pulse_1s_ease-in-out_infinite]" />
                            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--primary)] animate-[pulse_1s_ease-in-out_infinite_200ms]" />
                            <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--primary)] animate-[pulse_1s_ease-in-out_infinite_400ms]" />
                        </div>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-5 h-5 md:w-6 md:h-6 text-destructive opacity-80" />
                        <span className="text-[7px] font-black uppercase tracking-widest text-destructive/70">OFFLINE</span>
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
