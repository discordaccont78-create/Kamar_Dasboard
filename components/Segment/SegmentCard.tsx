
import React from 'react';
import { motion } from 'framer-motion';

interface SegmentCardProps {
  gpio: number;
  label: string;
  children: React.ReactNode;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

const MotionDiv = motion.div as any;

export const SegmentCard: React.FC<SegmentCardProps> = ({ gpio, label, children, onRemove, dragHandle }) => {
  return (
    <MotionDiv 
      layout
      // فاز ۱ و ۲: استایل‌های در حین جابجایی (طلایی، شفاف، چرخش)
      whileDrag={{ 
        opacity: 0.6, 
        rotate: 2,
        scale: 1.02,
        borderColor: "#daa520",
        boxShadow: "0 20px 40px rgba(218, 165, 32, 0.5)",
        zIndex: 1000,
        cursor: "grabbing"
      }}
      // فاز ۳: بازگشت نرم با انیمیشن Spring
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 35,
        layout: { duration: 0.25 } 
      }}
      className="bg-white dark:bg-[#121212] border-2 border-gray-200 dark:border-[#262626] rounded-bevel p-0 flex flex-col relative group bevel-shadow overflow-visible transition-colors duration-200 cursor-grab active:cursor-grabbing h-full"
    >
      {/* Legend-style Header */}
      <div className="absolute -top-4 left-6 px-4 bg-primary dark:bg-primary py-1.5 rounded-chip border-2 border-black/10 dark:border-white/20 shadow-md z-20 flex items-center gap-3">
        <div className="drag-handle pointer-events-auto">
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
      <div className="p-8 pt-12 relative z-10 flex flex-col gap-6 h-full">
        {children}
      </div>

      {/* Hardware Screw Details */}
      <div className="absolute bottom-2 left-2 flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-20 pointer-events-none group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full border border-black dark:border-white" />
      </div>
      
      {/* Visual feedback for focus */}
      <div className="absolute inset-0 rounded-bevel border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-all duration-300" />
    </MotionDiv>
  );
};
