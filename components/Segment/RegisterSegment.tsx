
import React from 'react';
import { Cpu } from 'lucide-react';
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
  onToggleBit: (bit: number) => void;
}

export const RegisterSegment: React.FC<Props> = ({ segment, onToggleBit }) => {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Cpu size={12} /> 8-Bit IO Bus</label>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(bit => {
          const isActive = (segment.val_of_slide >> bit) & 1;
          return (
            <button
              key={bit}
              onClick={() => onToggleBit(bit)}
              className={`py-4 rounded-lg border-2 font-black text-[10px] transition-all ${
                isActive 
                ? 'bg-primary border-primary text-black shadow-lg scale-105' 
                : 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400'
              }`}
            >
              BIT {bit}
            </button>
          );
        })}
      </div>
    </div>
  );
};
