
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Cpu, Laptop, Smartphone, Tablet } from 'lucide-react';
import { cn } from '../../lib/utils';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

const CLIP_FOOTER_LEFT = "polygon(0 12px, 12px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";
const CLIP_FOOTER_RIGHT = "polygon(20px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";
const CLIP_BRIDGE = "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";

interface DashboardFooterProps {
    isDragging: boolean;
    dragType: 'none' | 'group' | 'segment';
    floatingIslands: boolean;
    cursorColor: string;
    t: any; // Translations
    deviceInfo: { label: string, icon: 'desktop' | 'mobile' | 'tablet' };
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ 
    isDragging, 
    dragType, 
    floatingIslands, 
    cursorColor, 
    t, 
    deviceInfo 
}) => {
  const activeAccent = cursorColor || '#daa520';

  const footerVariants = {
    hidden: { y: 50, opacity: 0 },
    locked: { 
        y: 0, x: 0, opacity: 1,
        transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    floatLeft: { 
        y: [0, -4, 1, -2, 0], x: [0, 1, -1, 0], opacity: 1,
        transition: { y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, x: { duration: 5, repeat: Infinity, ease: "easeInOut" }}
    },
    floatRight: { 
        y: [0, 2, -1, 2, 0], x: [0, -2, 1, -1, 0], opacity: 1,
        transition: { y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, x: { duration: 8, repeat: Infinity, ease: "easeInOut" }}
    }
  };

  return (
    <footer className="fixed bottom-3 md:bottom-6 left-0 w-full px-2 md:px-8 z-[40] pointer-events-none">
        <div className={cn(
            "max-w-[1400px] mx-auto flex items-end justify-between relative h-12 md:h-14 transition-all duration-300",
            isDragging ? "gap-0" : "gap-2 md:gap-4" 
        )}>
        
        {/* LEFT FOOTER ISLAND */}
        <MotionDiv 
            layout
            variants={footerVariants}
            initial="hidden"
            animate={isDragging ? "locked" : (floatingIslands ? "floatLeft" : "locked")} 
            className="relative h-full min-w-[140px] md:min-w-[200px] pointer-events-auto filter drop-shadow-lg z-20 shrink-0"
        >
            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md" style={{ clipPath: CLIP_FOOTER_LEFT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-xl flex items-center px-4 md:px-6" style={{ clipPath: CLIP_FOOTER_LEFT }}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Cpu className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-foreground/90 leading-none">ESP32-NODE</span>
                        <span className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Core Active</span>
                    </div>
                </div>
            </div>
        </MotionDiv>

        {/* DRAG DROP ZONE */}
        <AnimatePresence mode="wait">
            {isDragging && (
            <MotionDiv 
                layout
                initial={{ opacity: 0, scaleY: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scaleY: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scaleY: 0, filter: 'blur(10px)' }}
                originY={1}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex-1 h-full relative z-30 pointer-events-auto flex items-center justify-center group mx-[-2px]" 
            >
                <div 
                    className="absolute inset-0 backdrop-blur-md transition-all group-hover:opacity-100 opacity-50" 
                    style={{ clipPath: CLIP_BRIDGE, backgroundColor: activeAccent }}
                />
                <div 
                    className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 flex items-center justify-center overflow-hidden" 
                    style={{ clipPath: CLIP_BRIDGE }}
                >
                    <div 
                        className="absolute inset-0 opacity-10" 
                        style={{ 
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${activeAccent} 10px, ${activeAccent} 20px)`,
                            backgroundSize: '200% 200%'
                        }}
                    />
                    <div 
                        className="relative z-10 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                        style={{ color: activeAccent }}
                    >
                        <Trash2 className="w-5 h-5 md:w-6 md:h-6 animate-bounce" strokeWidth={2.5} />
                        <span className="font-black text-xs md:text-sm uppercase tracking-[0.25em]">
                            {dragType === 'group' ? t.release_delete_group : (dragType === 'segment' ? t.release_delete_segment : t.release_delete)}
                        </span>
                    </div>
                </div>
            </MotionDiv>
            )}
        </AnimatePresence>

        {/* RIGHT FOOTER ISLAND */}
        <MotionDiv 
            layout
            variants={footerVariants}
            initial="hidden"
            animate={isDragging ? "locked" : (floatingIslands ? "floatRight" : "locked")}
            className="relative h-full min-w-[140px] md:min-w-[200px] pointer-events-auto filter drop-shadow-lg flex justify-end z-20 shrink-0"
        >
            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md" style={{ clipPath: CLIP_FOOTER_RIGHT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-xl flex items-center justify-end px-4 md:px-6" style={{ clipPath: CLIP_FOOTER_RIGHT }}>
                <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5 transition-colors duration-300" style={{ color: activeAccent }}>
                        {deviceInfo.icon === 'mobile' && <Smartphone size={10} />}
                        {deviceInfo.icon === 'tablet' && <Tablet size={10} />}
                        {deviceInfo.icon === 'desktop' && <Laptop size={10} />}
                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{deviceInfo.label}</span>
                    </div>
                    <div className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        SECURE LINK V3.1
                    </div>
                </div>
            </div>
        </MotionDiv>

        </div>
    </footer>
  );
};
