
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Send, Trash2, Clock } from 'lucide-react';
import { Slider } from '../UI/Slider';
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
  onToggle: () => void;
  onPWMChange: (val: number) => void;
}

const MotionDiv = motion.div as any;

export const CustomSegment: React.FC<Props> = ({ segment, onToggle, onPWMChange }) => {
  const isOn = segment.is_led_on === 'on';
  const [code, setCode] = useState("");

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      {/* Power Control */}
      {(segment.segType === 'All' || segment.segType === 'Digital') && (
        <div className="flex flex-col gap-2">
           <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Relay Logic</label>
           <button
            onClick={onToggle}
            className={`w-full py-3 rounded-lg font-black text-sm tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-3 border-b-2 active:border-b-0 active:translate-y-0.5
              ${isOn 
                ? 'bg-primary border-secondary text-black' 
                : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-400 dark:text-gray-600'
              }`}
          >
            <Power className={`${isOn ? 'animate-pulse' : ''}`} size={16} />
            {isOn ? 'ACTIVE' : 'IDLE'}
          </button>
        </div>
      )}

      {/* Proportional Control */}
      {(segment.segType === 'All' || segment.segType === 'PWM') && (
        <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col gap-3">
          <Slider
            label="PWM Intensity"
            value={segment.val_of_slide}
            onChange={onPWMChange}
            min={0}
            max={255}
          />
        </div>
      )}

      {/* Code Injection Section - Optimized size and responsiveness */}
      <div className="flex flex-col gap-2 bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Protocol Injector</label>
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            placeholder="Command Hex..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            // Added min-w-0 to prevent flex item overflow
            className="flex-1 min-w-0 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono dark:text-white outline-none focus:border-primary transition-colors"
          />
          <button className="bg-black text-primary p-2 rounded-lg hover:bg-primary hover:text-black transition-all shrink-0">
            <Send size={14} />
          </button>
          <button 
            onClick={() => setCode("")}
            className="bg-gray-100 dark:bg-white/5 text-gray-400 p-2 rounded-lg hover:text-red-500 transition-all shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Timer Section */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-gray-400">
           <Clock size={12} />
           <span className="text-[9px] font-black uppercase tracking-widest">Runtime</span>
        </div>
        <div className="flex gap-1 font-mono text-[10px] font-black dark:text-white">
          <span className="bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">00</span>:
          <span className="bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded text-primary">00</span>:
          <span className="bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">00</span>
        </div>
      </div>
    </MotionDiv>
  );
};
