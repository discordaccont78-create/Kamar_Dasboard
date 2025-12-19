
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
      className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#222] rounded-bevel p-0 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group overflow-hidden bevel-shadow ring-1 ring-black/5 dark:ring-white/5"
    >
      {/* Industrial Bevel Header */}
      <div className="bg-primary dark:bg-secondary border-b border-black/10 dark:border-white/10 p-4 flex items-center justify-between relative overflow-hidden">
        {/* Metal Texture Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />
        
        <div className="flex items-center gap-3 relative z-10">
           <div className="p-1 rounded bg-black/10 hover:bg-black/20 transition-colors cursor-grab active:cursor-grabbing">
            {dragHandle}
           </div>
           <div className="flex flex-col">
              <span className="text-black font-black text-[13px] tracking-tight uppercase leading-none">
                {label}
              </span>
              <span className="text-[9px] font-black text-black/50 uppercase tracking-[0.2em] mt-1">
                HARDWARE MAPPING: PIN-{gpio}
              </span>
           </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="bg-black text-primary px-3 py-1 rounded-chip text-[9px] font-black border border-white/20 shadow-lg">
            NODE-0X{gpio.toString(16).toUpperCase().padStart(2, '0')}
          </div>
          {onRemove && (
            <button 
              onClick={onRemove}
              className="bg-black/10 hover:bg-black text-black hover:text-white p-1.5 rounded-lg transition-all"
              title="Decommission Module"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6 relative z-10 flex flex-col gap-6">
        {children}
      </div>

      {/* Decorative Hardware Detail - Industrial Screws */}
      <div className="absolute bottom-2 left-2 flex gap-1 opacity-10">
        <div className="w-2 h-2 rounded-full border border-black dark:border-white relative">
            <div className="absolute top-1/2 left-[1px] right-[1px] h-[1px] bg-black dark:bg-white rotate-45" />
        </div>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-10">
        <div className="w-2 h-2 rounded-full border border-black dark:border-white relative">
            <div className="absolute top-1/2 left-[1px] right-[1px] h-[1px] bg-black dark:bg-white -rotate-45" />
        </div>
      </div>
    </motion.div>
  );
};
