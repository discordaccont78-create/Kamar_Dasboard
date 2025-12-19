
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
      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-bevel p-6 flex flex-col gap-6 bevel-shadow relative overflow-hidden group transition-all duration-300 hover:border-primary/50"
    >
      {/* Visual Hardware Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary transition-colors cursor-grab active:cursor-grabbing">
            {dragHandle}
           </div>
           <div className="flex flex-col">
              <h4 className="text-black dark:text-white font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                {label}
              </h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Port Channel: GP-{gpio}
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-black text-primary px-3 py-1 rounded-chip text-[9px] font-black border border-primary/20 shadow-md">
            HARDWARE-IO
          </div>
          {onRemove && (
            <button 
              onClick={onRemove}
              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              title="Decommission Module"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="relative z-10 space-y-4">
        {children}
      </div>

      {/* Industrial Screws Detail */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-20">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      </div>
    </motion.div>
  );
};
