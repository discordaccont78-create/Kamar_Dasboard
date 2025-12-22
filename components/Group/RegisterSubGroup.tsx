import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Cpu } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { Segment } from '../../types/index';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';

interface Props {
  segments: Segment[];
  onToggle: (id: string) => void;
  dragHandle?: React.ReactNode;
}

const MotionDiv = motion.div as any;

/**
 * A Compact Button for a single bit inside the Register Sub-Group
 */
const RegisterBitButton = React.memo(({ 
  segment, 
  onToggle 
}: { 
  segment: Segment; 
  onToggle: () => void; 
}) => {
    const isOn = segment.is_led_on === 'on';

    return (
        <button 
            onClick={onToggle}
            className={cn(
                "relative flex flex-col justify-between p-2 rounded-lg border transition-all duration-200 active:scale-[0.98] h-16 overflow-hidden",
                isOn 
                    ? "bg-primary/20 border-primary shadow-[0_0_10px_-4px_var(--primary)]" 
                    : "bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10"
            )}
        >
            <div className="flex justify-between w-full">
                 <span className="text-[7px] font-mono font-bold opacity-50">#{segment.regBitIndex}</span>
                 <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOn ? "bg-primary shadow-[0_0_5px_var(--primary)]" : "bg-muted-foreground/30"
                )} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-left truncate w-full leading-tight">
                {segment.name}
            </span>
        </button>
    );
});

export const RegisterSubGroup: React.FC<Props> = ({ segments, onToggle, dragHandle }) => {
  // Sort bits by index
  const sortedSegments = [...segments].sort((a, b) => (a.regBitIndex || 0) - (b.regBitIndex || 0));
  const masterSegment = sortedSegments[0]; // Used for Labeling the Container

  return (
    <SegmentCard 
        gpio={masterSegment.gpio || 0} 
        label="74HC595 MODULE" // Static label for the container
        dragHandle={dragHandle}
    >
        <div className="flex flex-col gap-3 -mt-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Cpu size={10} /> 8-Bit Register
                </span>
                <span className="text-[8px] font-mono font-bold opacity-50">
                   DS:{masterSegment.dsPin} | CP:{masterSegment.shcpPin}
                </span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
                {sortedSegments.map(seg => (
                    <RegisterBitButton 
                        key={seg.num_of_node} 
                        segment={seg} 
                        onToggle={() => onToggle(seg.num_of_node)} 
                    />
                ))}
            </div>
        </div>
    </SegmentCard>
  );
};
