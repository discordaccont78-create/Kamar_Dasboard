
import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { Segment } from '../../types/index';
import { GroupHeader } from './GroupHeader';
import { cn } from '../../lib/utils';
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
              size={18} 
            />
          </div>
        }
      >
        {/* Render Logic: Register Bits are just CustomSegments now */}
        {(segment.groupType === 'custom' || segment.groupType === 'register') && (
          <CustomSegment 
            segment={segment} 
            onToggle={() => onToggle(segment.num_of_node)} 
            onPWMChange={(val) => onPWMChange(segment.num_of_node, val)} 
          />
        )}
        {segment.groupType === 'input' && <InputSegment segment={segment} />}
        {segment.groupType === 'weather' && <WeatherSegment segment={segment} />}
      </SegmentCard>
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

  return (
    <div 
      className="h-full relative border-2 border-dashed rounded-[2rem] p-8 transition-all duration-500 backdrop-blur-[2px]"
      style={containerStyle} 
    >
      {/* Group Boundary Label & Drag Handle */}
      <div 
        className="absolute -top-3 left-8 pl-1 pr-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors z-10 border border-dashed rounded-full backdrop-blur-md"
        style={labelStyle}
      >
        {dragHandle && (
           <div className="bg-primary/20 hover:bg-primary/40 rounded-full p-1 cursor-grab active:cursor-grabbing transition-colors -ml-1">
              {dragHandle}
           </div>
        )}
        <span>ZONE: {name}</span>
      </div>

      <div className="-mt-2 mb-6">
         <GroupHeader name={name} count={segments.length} />
      </div>
      
      <div 
        ref={containerRef}
        className={cn(
          "grid gap-6 relative min-h-[100px]",
          segments.length === 2 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        <AnimatePresence mode="popLayout">
          {segments.map((seg, index) => {
            const isLastAndOdd = segments.length % 2 !== 0 && index === segments.length - 1;
            
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
