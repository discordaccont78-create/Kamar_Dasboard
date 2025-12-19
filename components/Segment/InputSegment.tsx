
import React from 'react';
import { Terminal } from 'lucide-react';
// Fixed: Explicit path to types index
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
}

export const InputSegment: React.FC<Props> = ({ segment }) => {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Terminal size={12} /> State Analyzer</label>
      <div className={`py-12 text-center text-5xl font-black rounded-2xl border-4 transition-all duration-500 ${
        segment.inputActive ? 'bg-primary/10 border-primary text-primary shadow-[0_0_40px_rgba(218,165,32,0.1)]' : 'bg-gray-200 dark:bg-black/30 border-gray-300 dark:border-[#333] text-gray-400'
      }`}>
        {segment.inputActive ? '1 (HIGH)' : '0 (LOW)'}
      </div>
    </div>
  );
};
