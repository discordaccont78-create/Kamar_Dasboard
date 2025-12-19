
import React from 'react';
import { Cpu } from 'lucide-react';
import { Segment } from '../../types/index';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Props {
  segment: Segment;
  onToggleBit: (bit: number) => void;
}

export const RegisterSegment: React.FC<Props> = ({ segment, onToggleBit }) => {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-[10px] text-muted-foreground font-black uppercase flex items-center gap-2"><Cpu size={12} /> 8-Bit IO Bus</label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 lg:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(bit => {
          const isActive = (segment.val_of_slide >> bit) & 1;
          return (
            <Button
              key={bit}
              onClick={() => onToggleBit(bit)}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "h-12 font-black text-[10px] transition-all",
                isActive ? "shadow-lg scale-105 z-10" : "text-muted-foreground hover:border-primary/50"
              )}
            >
              PIN {bit}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
