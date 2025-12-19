
import React from 'react';
import { motion } from 'framer-motion';

interface SegmentCardProps {
  gpio: number;
  label: string;
  children: React.ReactNode;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

// Fix: Using any for motion.div to resolve intrinsic property type errors in the current environment
const MotionDiv = motion.div as any;

export const SegmentCard: React.FC<SegmentCardProps> = ({ gpio, label, children, onRemove, dragHandle }) => {
  return (
    <MotionDiv 
      layout
      className="bg-white dark:bg-[#121212] border-2 border-gray-200 dark:border-[#262626] rounded-bevel p-0 flex flex-col relative group bevel-shadow overflow-visible"
    >
      {/* Legend-style Header with hardware-inspired styling */}
      <div className="absolute -top-4 left-6 px-4 bg-primary dark:bg-primary py-1.5 rounded-chip border-2 border-black/10 dark:border-white/20 shadow-md z-20 flex items-center gap-3">
        <div className="drag-handle cursor-grab active:cursor-grabbing">
          {dragHandle}
        </div>
        <div className="flex flex-col">
          <span className="text-black font-black text-[10px] tracking-tight uppercase leading-none">
            group-name: {label}
          </span>
          <span className="text-black/60 font-black text-[8px] uppercase tracking-widest mt-0.5">
            pin-number: GP-{gpio}
          </span>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-8 pt-12 relative z-10 flex flex-col gap-6">
        {children}
      </div>

      {/* Hardware Screw Details for industrial aesthetics */}
      <div className="absolute bottom-2 left-2 flex gap-1 opacity-20 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-20 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
    </MotionDiv>
  );
};
