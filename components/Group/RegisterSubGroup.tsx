
import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Cpu, Power } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { Segment } from '../../types/index';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';
import { ItemPosition } from './DraggableDisplayItem';

// Workaround for Framer Motion type compatibility
const MotionDiv = motion.div as any;

interface Props {
  segments: Segment[];
  onToggle: (id: string) => void;
  dragHandle?: React.ReactNode;
  position?: ItemPosition;
  isLast?: boolean;
}

/**
 * A Minimal "Power" Button for a single bit inside the Register Sub-Group.
 * Mimics the style of the main CustomSegment button but clearer and more compact.
 */
const RegisterBitButton = React.memo(({ 
  segment, 
  onToggle 
}: { 
  segment: Segment; 
  onToggle: () => void; 
}) => {
    const { settings } = useSettingsStore();
    const isOn = segment.is_led_on === 'on';

    return (
        <button 
            onClick={onToggle}
            className="relative flex flex-col justify-between p-2 md:p-3 transition-all duration-300 active:scale-[0.96] overflow-hidden group outline-none min-h-[4.5rem] flex-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-white/5"
        >
            {/* Striped Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,currentColor_2px,currentColor_3px)] pointer-events-none" />

            {/* Left Status Strip */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out z-20",
                isOn ? "w-1 bg-primary shadow-[0_0_10px_var(--primary)]" : "w-[2px] bg-primary/20"
            )}>
                {/* Inner flowing energy when ON and Animations Enabled */}
                {isOn && settings.animations && (
                    <MotionDiv 
                        className="absolute left-0 right-0 h-[40%] bg-white/60 blur-[1px]"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            {/* Header: Bit Index and Indicator */}
            <div className="flex justify-between w-full relative z-10 items-start pl-1.5">
                 <span className="text-[7px] font-mono font-bold opacity-40 uppercase tracking-widest">Bit #{segment.regBitIndex}</span>
                 <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    isOn ? "bg-primary shadow-[0_0_8px_var(--primary)] scale-110" : "bg-muted-foreground/30"
                )} />
            </div>

            {/* Content: Icon and Name */}
            <div className="flex items-end justify-between w-full relative z-10 mt-1 gap-2 pl-1.5">
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider text-left truncate w-full leading-tight transition-colors",
                        isOn ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {segment.name}
                    </span>
                    <span className={cn(
                        "text-[7px] font-bold uppercase transition-colors",
                        isOn ? "text-primary" : "text-muted-foreground/40"
                    )}>
                        {isOn ? "ACTIVE" : "OFF"}
                    </span>
                </div>
                
                <Power size={14} className={cn(
                    "transition-all duration-300 mb-0.5",
                    isOn ? "text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]" : "text-muted-foreground/30"
                )} />
            </div>

            {/* Tech Corner Accents (Subtle) */}
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Bottom Active Line */}
            <div className={cn(
                 "absolute bottom-0 left-0 h-[1px] transition-all duration-500 ease-out",
                 isOn ? "w-full bg-primary" : "w-0 bg-transparent"
            )} />
        </button>
    );
});

export const RegisterSubGroup: React.FC<Props> = ({ segments, onToggle, dragHandle, position, isLast }) => {
  // Sort bits by index
  const sortedSegments = [...segments].sort((a, b) => (a.regBitIndex || 0) - (b.regBitIndex || 0));
  const masterSegment = sortedSegments[0]; // Used for Labeling the Container

  return (
    <SegmentCard 
        gpio={masterSegment.gpio || 0} 
        label="74HC595 MODULE" // Static label for the container
        dragHandle={dragHandle}
        position={position}
        isLast={isLast}
        segmentId={`reg-group-${masterSegment.gpio}`}
    >
        <div className="flex flex-col gap-3 -mt-2 h-full">
            {/* Header Info */}
            <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Cpu size={10} /> 8-Bit Register
                </span>
                <span className="text-[8px] font-mono font-bold opacity-50 bg-secondary/10 px-1.5 py-0.5 rounded text-foreground/70">
                   DS:{masterSegment.dsPin} | SH:{masterSegment.shcpPin} | ST:{masterSegment.stcpPin}
                </span>
            </div>
            
            {/* 
                Responsive Grid System:
                - h-full: Ensures the grid fills the parent card height.
                - grid-cols-2: On mobile, show 2 columns.
                - sm:grid-cols-4: On desktop, show 4 columns.
            */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
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
