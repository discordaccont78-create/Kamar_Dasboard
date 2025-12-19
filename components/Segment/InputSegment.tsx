
import React from 'react';
import { Terminal, Shield } from 'lucide-react';
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
}

export const InputSegment: React.FC<Props> = ({ segment }) => {
  const isActive = segment.inputActive;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2 tracking-widest">
            <Terminal size={14} /> State Analyzer
        </label>
        <div className="flex gap-4">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Pullup: ON</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Logic: Toggle</span>
        </div>
      </div>

      <div className="relative group">
        <div className={`py-12 text-center text-7xl font-black rounded-3xl border-2 transition-all duration-700 relative z-10 overflow-hidden
          ${isActive 
            ? 'bg-primary/5 border-primary text-primary shadow-[0_0_50px_rgba(218,165,32,0.2)]' 
            : 'bg-gray-50 dark:bg-black/30 border-gray-200 dark:border-white/5 text-gray-300 dark:text-white/10'
          }`}
        >
          {isActive ? '1' : '0'}
          
          {/* Subtle heartbeat animation for active state */}
          {isActive && (
            <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
          )}
        </div>

        <div className={`absolute -top-3 -right-3 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest z-20 shadow-xl transition-all duration-500 border
            ${isActive 
                ? 'bg-primary text-black border-white/20' 
                : 'bg-gray-400 text-white border-white/10'
            }`}
        >
          {isActive ? 'HIGH' : 'LOW'}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
        <Shield size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Secure Input Monitoring System
        </span>
      </div>
    </div>
  );
};
