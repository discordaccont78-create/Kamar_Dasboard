
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

const MotionCard = motion(Card) as any;

export const SegmentCard: React.FC<SegmentCardProps> = ({ gpio, label, children, onRemove, dragHandle }) => {
  const { settings } = useSettingsStore();
  const labelFontClass = isPersian(label) ? "font-persian" : getFontClass(settings.dashboardFont);
  
  // Dynamically resolve icon for the segment
  const SegmentIcon = getIconForName(label, 'device');

  return (
    <MotionCard 
      layout
      whileDrag={{ 
        opacity: 0.6, 
        rotate: 2,
        scale: 1.03,
        borderColor: "#daa520",
        boxShadow: "0 25px 50px -12px rgba(218, 165, 32, 0.6)",
        zIndex: 1000,
        cursor: "grabbing"
      }}
      transition={{ 
        type: "spring", 
        stiffness: 450, 
        damping: 30,
        layout: { duration: 0.25 }
      }}
      className="border-2 border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark rounded-xl md:rounded-bevel p-0 flex flex-col relative group bevel-shadow overflow-visible cursor-grab active:cursor-grabbing h-full select-none"
    >
      {/* Industrial Hardware Label - Compact on Mobile */}
      <div className="absolute -top-3 md:-top-4 left-4 md:left-6 px-3 md:px-4 bg-primary dark:bg-primary py-1 md:py-1.5 rounded-chip border-2 border-black/10 dark:border-white/20 shadow-md z-20 flex items-center gap-2 md:gap-3 max-w-[85%]">
        <div className="drag-handle pointer-events-auto shrink-0 border-r border-black/10 dark:border-white/10 pr-2 mr-1">
          {dragHandle}
        </div>
        
        {/* Dynamic Smart Icon */}
        <div className="text-black opacity-80">
            <SegmentIcon size={14} strokeWidth={2.5} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-black font-black text-[9px] md:text-[10px] tracking-tight uppercase leading-none truncate",
            labelFontClass
          )}>
            {label}
          </span>
          <span className="text-black/60 font-black text-[7px] md:text-[8px] uppercase tracking-widest mt-0.5 font-mono hidden xs:block">
            GP-{gpio}
          </span>
        </div>
      </div>
      
      {/* Core Logic Interface - Compact Padding */}
      <CardContent className="p-4 pt-10 md:p-6 md:pt-12 relative z-10 flex flex-col gap-4 md:gap-6 h-full">
        {children}
      </CardContent>

      {/* Decorative Hardware Detailing - Hidden on small mobile */}
      <div className="absolute bottom-2 left-2 hidden md:flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
      <div className="absolute bottom-2 right-2 hidden md:flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
    </MotionCard>
  );
};
