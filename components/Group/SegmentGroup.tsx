
import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Power } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { Segment } from '../../types/index';
import { GroupHeader } from './GroupHeader';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';

interface Props {
  name: string;
  segments: Segment[];
  onReorder: (newSegments: Segment[]) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onPWMChange: (id: string, val: number) => void;
  onToggleBit: (id: string, bit: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  dragHandle?: React.ReactNode; 
}

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

/**
 * Specialized Simple Button for Register Bits
 * Must be small, simple, but draggable.
 */
const RegisterButton = React.memo(({ 
  segment, 
  onToggle, 
  dragHandle 
}: { 
  segment: Segment; 
  onToggle: () => void; 
  dragHandle: React.ReactNode 
}) => {
    const isOn = segment.is_led_on === 'on';

    return (
        <div className="flex h-12 md:h-14 bg-card border border-border rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors group">
            {/* Drag Handle Area */}
            <div className="w-6 md:w-8 bg-secondary/10 flex items-center justify-center cursor-grab active:cursor-grabbing border-r border-border/50">
                {dragHandle}
            </div>
            
            {/* Interactive Button Area */}
            <button 
                onClick={onToggle}
                className={cn(
                    "flex-1 flex items-center justify-between px-2 md:px-4 transition-all duration-200 active:scale-[0.98]",
                    isOn ? "bg-primary/10" : "bg-transparent hover:bg-secondary/5"
                )}
            >
                <div className="flex flex-col items-start gap-0 md:gap-0.5 overflow-hidden">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate w-full text-left">{segment.name}</span>
                    <span className="text-[7px] md:text-[8px] font-mono font-bold opacity-50">IDX {segment.regBitIndex}</span>
                </div>

                {/* LED Indicator */}
                <div className={cn(
                    "w-2 h-2 md:w-3 md:h-3 rounded-full border shadow-inner transition-all duration-300 shrink-0",
                    isOn 
                        ? "bg-primary border-primary shadow-[0_0_8px_rgba(218,165,32,0.6)]" 
                        : "bg-black/20 dark:bg-white/10 border-transparent"
                )} />
            </button>
        </div>
    );
});

// Wrapper component to handle individual drag controls - Memoized
const DraggableSegmentItem = React.memo(({ 
  segment, 
  index, 
  containerRef, 
  moveItem, 
  onRemove,
  onToggle,
  onPWMChange,
  onToggleBit,
  onDragStart,
  onDragEnd,
  lastReorderTime,
  className
}: {
  segment: Segment,
  index: number,
  containerRef: React.RefObject<HTMLDivElement>,
  moveItem: (fromIndex: number, toIndex: number) => void,
  onRemove: (id: string) => void,
  onToggle: (id: string) => void,
  onPWMChange: (id: string, val: number) => void,
  onToggleBit: (id: string, bit: number) => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
  lastReorderTime: React.MutableRefObject<number>,
  className?: string
}) => {
  const controls = useDragControls();

  const handleDrag = (event: any, info: any) => {
    if (!containerRef.current) return;
    
    // THROTTLE: Only allow 1 swap check every 400ms to prevent crash
    const now = Date.now();
    if (now - lastReorderTime.current < 400) return;

    const dragX = info.point.x;
    const dragY = info.point.y;
    
    // Get all items freshly from DOM
    const items = Array.from(containerRef.current.querySelectorAll('.segment_area')) as HTMLElement[];
    
    let targetIndex = -1;

    // Check overlap
    items.forEach((item, idx) => {
      if (idx === index) return; // Don't check against self

      const rect = item.getBoundingClientRect();
      
      // Strict boundary check: Mouse must be strictly inside the target box
      const isOver = 
        dragX > rect.left && 
        dragX < rect.right && 
        dragY > rect.top && 
        dragY < rect.bottom;

      if (isOver) {
        targetIndex = idx;
      }
    });

    if (targetIndex !== -1 && targetIndex !== index) {
      moveItem(index, targetIndex);
      lastReorderTime.current = Date.now(); // Update timestamp
    }
  };

  const isRegister = segment.groupType === 'register';

  return (
    <MotionDiv 
      key={segment.num_of_node}
      layout="position" // Optimize layout animation
      drag
      dragListener={false} // IMPORTANT: Disables dragging by clicking anywhere
      dragControls={controls} // Only drag via handle
      dragSnapToOrigin
      dragElastic={0.1}
      onDragStart={() => {
        onDragStart?.();
      }}
      onDrag={handleDrag}
      onDragEnd={(event: any, info: any) => {
        onDragEnd?.();
        const thresholdY = window.innerHeight - 110;
        // Check for deletion zone
        if (info.point.y > thresholdY) {
          onRemove(segment.num_of_node);
        }
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn("segment_area z-0 hover:z-10 relative", className)}
      style={{ touchAction: 'none' }}
    >
      {/* Conditional Rendering: Simple Button vs Full Card */}
      {isRegister ? (
          <RegisterButton 
            segment={segment} 
            onToggle={() => onToggle(segment.num_of_node)}
            dragHandle={
                <div 
                  className="cursor-grab active:cursor-grabbing p-1 opacity-50 hover:opacity-100 transition-opacity"
                  onPointerDown={(e) => controls.start(e)}
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical size={14} />
                </div>
            }
          />
      ) : (
          <SegmentCard 
            gpio={segment.gpio || 0} 
            label={segment.name}
            dragHandle={
              <div 
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded transition-colors"
                onPointerDown={(e) => controls.start(e)}
                style={{ touchAction: 'none' }}
              >
                <GripVertical 
                  className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors" 
                  size={16} 
                />
              </div>
            }
          >
            {segment.groupType === 'custom' && (
              <CustomSegment 
                segment={segment} 
                onToggle={() => onToggle(segment.num_of_node)} 
                onPWMChange={(val) => onPWMChange(segment.num_of_node, val)} 
              />
            )}
            {segment.groupType === 'input' && <InputSegment segment={segment} />}
            {segment.groupType === 'weather' && <WeatherSegment segment={segment} />}
          </SegmentCard>
      )}
    </MotionDiv>
  );
});

export const SegmentGroup: React.FC<Props> = React.memo(({ 
  name,
  segments, 
  onReorder, 
  onRemove, 
  onToggle, 
  onPWMChange, 
  onToggleBit,
  onDragStart,
  onDragEnd,
  dragHandle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  
  // This ref persists across renders to track the last time a swap occurred
  const lastReorderTime = useRef<number>(0);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newSegments = [...segments];
    const [movedItem] = newSegments.splice(fromIndex, 1);
    newSegments.splice(toIndex, 0, movedItem);
    onReorder(newSegments);
  };

  // Memoize style to prevent object creation on render
  const containerStyle = useMemo(() => ({
    borderColor: `${settings.primaryColor}40`, 
    backgroundColor: `${settings.primaryColor}08`, 
    backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}05 0%, transparent 100%)`
  }), [settings.primaryColor]);

  const labelStyle = useMemo(() => ({
    color: 'var(--primary)',
    borderColor: `${settings.primaryColor}40`,
    backgroundColor: `${settings.primaryColor}15`
  }), [settings.primaryColor]);

  // Determine Grid Layout based on content type
  const isRegisterGroup = segments.some(s => s.groupType === 'register');
  const gridClass = isRegisterGroup 
    ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-3" 
    : (segments.length === 2 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6");
    
  // Smart Font Class for Zone Name
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);

  return (
    <div 
      className="h-full relative border-2 border-dashed rounded-xl md:rounded-[2rem] p-3 pt-6 md:p-8 transition-all duration-500 backdrop-blur-[2px]"
      style={containerStyle} 
    >
      {/* Group Boundary Label & Drag Handle */}
      <div 
        className={cn(
          "absolute -top-3 left-4 md:left-8 pl-1 pr-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors z-10 border border-dashed rounded-full backdrop-blur-md",
          zoneFontClass
        )}
        style={labelStyle}
      >
        {dragHandle && (
           <div className="bg-primary/20 hover:bg-primary/40 rounded-full p-1 cursor-grab active:cursor-grabbing transition-colors -ml-1">
              {dragHandle}
           </div>
        )}
        <span className="truncate max-w-[150px] md:max-w-none">ZONE: {name}</span>
      </div>

      <div className="-mt-1 mb-3 md:-mt-2 md:mb-6">
         <GroupHeader name={name} count={segments.length} />
      </div>
      
      <div 
        ref={containerRef}
        className={cn(
          "grid relative min-h-[50px] md:min-h-[100px]",
          gridClass
        )}
      >
        <AnimatePresence mode="popLayout">
          {segments.map((seg, index) => {
            const isLastAndOdd = !isRegisterGroup && segments.length % 2 !== 0 && index === segments.length - 1;
            
            return (
              <DraggableSegmentItem 
                key={seg.num_of_node}
                segment={seg}
                index={index}
                containerRef={containerRef}
                moveItem={moveItem}
                onRemove={onRemove}
                onToggle={onToggle}
                onPWMChange={onPWMChange}
                onToggleBit={onToggleBit}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                lastReorderTime={lastReorderTime}
                className={isLastAndOdd ? "lg:col-span-2" : ""}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});
