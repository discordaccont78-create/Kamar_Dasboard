
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';

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
      className="border-2 border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark rounded-bevel p-0 flex flex-col relative group bevel-shadow overflow-visible cursor-grab active:cursor-grabbing h-full select-none"
    >
      {/* Industrial Hardware Label - Updated to show Segment Name instead of group */}
      <div className="absolute -top-4 left-6 px-4 bg-primary dark:bg-primary py-1.5 rounded-chip border-2 border-black/10 dark:border-white/20 shadow-md z-20 flex items-center gap-3">
        <div className="drag-handle pointer-events-auto">
          {dragHandle}
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-black font-black text-[10px] tracking-tight uppercase leading-none",
            labelFontClass
          )}>
            DEVICE-ID: {label}
          </span>
          <span className="text-black/60 font-black text-[8px] uppercase tracking-widest mt-0.5 font-mono">
            pin-number: GP-{gpio}
          </span>
        </div>
      </div>
      
      {/* Core Logic Interface - Reduced padding from p-8 to p-6 for better fit */}
      <CardContent className="p-6 pt-12 relative z-10 flex flex-col gap-6 h-full">
        {children}
      </CardContent>

      {/* Decorative Hardware Detailing */}
      <div className="absolute bottom-2 left-2 flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
    </MotionCard>
  );
};
