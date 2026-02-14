
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';
import { getIconForName } from '../../lib/iconMapper';

interface SegmentCardProps {
  gpio: number;
  label: string;
  children: React.ReactNode;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

const MotionDiv = motion.div as any;

export const SegmentCard: React.FC<SegmentCardProps> = ({ gpio, label, children, onRemove, dragHandle }) => {
  const { settings } = useSettingsStore();
  const labelFontClass = isPersian(label) ? "font-persian" : getFontClass(settings.dashboardFont);
  
  // Dynamically resolve icon for the segment
  const SegmentIcon = getIconForName(label, 'device');

  // TECH SHAPE: Rect with cut Top-Right corner (Tab Style)
  const CLIP_CARD = "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)";

  return (
    <MotionDiv 
      layout
      className="relative group h-full select-none"
    >
      {/* BORDER GLOW LAYER */}
      <div 
        className="absolute inset-0 bg-border/80 dark:bg-white/10 transition-colors duration-300 group-hover:bg-primary/40"
        style={{ clipPath: CLIP_CARD }}
      />

      {/* CONTENT CONTAINER LAYER */}
      <div 
        className="relative h-full bg-card dark:bg-[#151518] flex flex-col overflow-hidden"
        style={{ 
            clipPath: CLIP_CARD,
            margin: '1px' // Border width
        }}
      >
          {/* 
             --- MODULE HEADER (The "Label Plate") --- 
             Angled to match the card cut.
          */}
          <div className="h-10 flex items-stretch border-b border-border/40 bg-secondary/5">
              {/* Drag Area */}
              <div className="flex items-center px-1 border-r border-border/40 bg-black/5 dark:bg-white/5">
                  {dragHandle}
              </div>

              {/* Title Area */}
              <div className="flex-1 flex items-center gap-2.5 px-3 min-w-0">
                  <div className="text-primary opacity-80 shrink-0">
                      <SegmentIcon size={14} strokeWidth={2.5} />
                  </div>
                  <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider text-foreground/90 truncate pt-0.5",
                      labelFontClass
                  )}>
                      {label}
                  </span>
              </div>

              {/* Technical GPIO Tag (Top Right Corner) */}
              <div className="w-[24px] relative">
                  {/* Empty space for the angle cut */}
              </div>
              <div className="absolute top-0 right-[24px] h-full flex items-center px-2">
                  <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-primary transition-colors">
                      GP-{gpio}
                  </span>
              </div>
          </div>
          
          {/* 
             --- CORE CONTENT ---
          */}
          <div className="p-4 relative z-10 flex flex-col gap-4 h-full bg-gradient-to-b from-transparent to-black/[0.02]">
            {children}
          </div>

          {/* 
             --- INDUSTRIAL DETAILS (Screws/Accents) --- 
          */}
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-primary/30 opacity-50" />
          <div className="absolute top-[24px] right-0 w-1 h-4 bg-primary/20" /> {/* Accent mark near cut */}

          {/* Active Glow Hint on Hover (Bottom Edge) */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/0 group-hover:bg-primary/50 transition-colors duration-500" />
      </div>
    </MotionDiv>
  );
};
