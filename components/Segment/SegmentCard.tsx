
import React from 'react';
import { motion } from 'framer-motion';

interface SegmentCardProps {
  gpio: number;
  label: string;
  children: React.ReactNode;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({ gpio, label, children, onRemove, dragHandle }) => {
  return (
    <motion.div 
      layout
      className="bg-gradient-to-br from-white to-gray-50 dark:from-[#2d2d2d] dark:to-[#1a1a1a] border-2 border-gray-300 dark:border-[#555] bevel-border p-4 flex flex-col gap-4 shadow-2xl hover:border-primary transition-all duration-300"
    >
      <div className="flex items-center justify-between -mx-4 -mt-4 bg-primary p-3 rounded-t-[14px] shadow-sm">
        <div className="flex items-center gap-3">
           {dragHandle}
           <span className="text-[10px] font-black px-2 py-0.5 bg-black text-white rounded-[4px] uppercase">
            IO {gpio}
           </span>
           <span className="text-black font-black text-xs tracking-tight uppercase">{label}</span>
        </div>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="bg-black/10 hover:bg-black/30 p-1.5 rounded-full text-black/60 hover:text-black transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-4 py-2">
        {children}
      </div>
    </motion.div>
  );
};
