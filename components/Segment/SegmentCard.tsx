
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
      // CONTAINER STYLE:
      // Darker, "Hard" background (bg-card/90 or a very deep slate).
      // Border is subtle but distinct.
      className={cn(
          "relative overflow-visible group",
          "bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10",
          "rounded-xl shadow-sm hover:shadow-lg transition-all duration-300",
          "flex flex-col h-full select-none"
      )}
    >
      {/* 
         --- MODULE HEADER (The "Label Plate") --- 
         Designed to look like a serial tag riveted to the device.
      */}
      <div className="h-9 flex items-center justify-between px-3 bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
              {/* Drag Handle Zone */}
              <div className="opacity-40 group-hover:opacity-100 transition-opacity border-r border-foreground/10 pr-2 -ml-1">
                  {dragHandle}
              </div>

              {/* Icon & Name */}
              <div className="text-primary opacity-80">
                  <SegmentIcon size={14} strokeWidth={2.5} />
              </div>
              <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider text-foreground/90 truncate pt-0.5",
                  labelFontClass
              )}>
                  {label}
              </span>
          </div>

          {/* Technical GPIO Tag */}
          <div className="flex items-center gap-1.5 opacity-50">
              <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-muted-foreground">GP-{gpio}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.4)]" /> {/* Status LED */}
          </div>
      </div>
      
      {/* 
         --- CORE CONTENT ---
         Padding adjusted for a tighter, more technical feel.
      */}
      <CardContent className="p-4 relative z-10 flex flex-col gap-4 h-full bg-gradient-to-b from-transparent to-black/[0.02]">
        {children}
      </CardContent>

      {/* 
         --- INDUSTRIAL DETAILS (Screws) --- 
         Visual flourishes to make it look mounted.
      */}
      <div className="absolute top-2.5 right-2.5 opacity-20 pointer-events-none hidden md:block">
         <div className="w-1 h-1 border border-foreground rounded-full bg-transparent" />
      </div>
      <div className="absolute bottom-2.5 left-2.5 opacity-20 pointer-events-none hidden md:block">
         <div className="w-1 h-1 border border-foreground rounded-full bg-transparent" />
      </div>
      <div className="absolute bottom-2.5 right-2.5 opacity-20 pointer-events-none hidden md:block">
         <div className="w-1 h-1 border border-foreground rounded-full bg-transparent" />
      </div>

      {/* Active Glow Hint on Hover (Bottom Edge) */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/0 group-hover:bg-primary/50 transition-colors duration-500" />
    </MotionCard>
  );
};
