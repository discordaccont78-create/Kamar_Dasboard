
import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { DisplaySegment } from '../Segment/DisplaySegment';
import { RegisterSubGroup } from './RegisterSubGroup';
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

// Define a Display Item which can be a single segment or a Sub-Group
type DisplayItem = 
  | { type: 'single'; id: string; segment: Segment }
  | { type: 'register_group'; id: string; segments: Segment[] }
  | { type: 'weather_group'; id: string; segments: Segment[] }; // Future extensibility

// Wrapper component to handle individual drag controls - Memoized
const DraggableDisplayItem = React.memo(({ 
  item, 
  index, 
  containerRef, 
  moveItem, 
  onRemove,
  onToggle,
  onPWMChange,
  onDragStart,
  onDragEnd,
  lastReorderTime,
  className
}: {
  item: DisplayItem,
  index: number,
  containerRef: React.RefObject<HTMLDivElement>,
  moveItem: (fromIndex: number, toIndex: number) => void,
  onRemove: (id: string) => void,
  onToggle: (id: string) => void,
  onPWMChange: (id: string, val: number) => void,
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
    items.forEach((element, idx) => {
      if (idx === index) return; // Don't check against self

      const rect = element.getBoundingClientRect();
      
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

  // Shared Drag Handle Props
  const dragHandleProps = {
    className: "cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded transition-colors",
    onPointerDown: (e: any) => controls.start(e),
    style: { touchAction: 'none' } as React.CSSProperties
  };

  const DragIcon = <GripVertical className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors" size={16} />;

  // Render logic based on type
  let content = null;
  const uniqueId = item.id;

  if (item.type === 'register_group') {
      content = (
          <RegisterSubGroup 
              segments={item.segments} 
              onToggle={onToggle}
              dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
          />
      );
  } else if (item.type === 'single') {
      const seg = item.segment;
      content = (
        <SegmentCard 
            gpio={seg.gpio || 0} 
            label={seg.name}
            dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
        >
            {seg.groupType === 'custom' && (
              <CustomSegment 
                segment={seg} 
                onToggle={() => onToggle(seg.num_of_node)} 
                onPWMChange={(val) => onPWMChange(seg.num_of_node, val)} 
              />
            )}
            {seg.groupType === 'input' && <InputSegment segment={seg} />}
            {seg.groupType === 'weather' && <WeatherSegment segment={seg} />}
            {seg.groupType === 'display' && <DisplaySegment segment={seg} />}
        </SegmentCard>
      );
  }

  // Handle Removal Logic
  const handleRemove = () => {
     if (item.type === 'single') {
         onRemove(item.id);
     } else {
         // Remove all segments in the sub-group
         item.segments.forEach(s => onRemove(s.num_of_node));
     }
  };

  return (
    <MotionDiv 
      key={uniqueId}
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
          handleRemove();
        }
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn("segment_area z-0 hover:z-10 relative h-full", className)}
      style={{ touchAction: 'none' }}
    >
      {content}
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
  onDragStart,
  onDragEnd,
  dragHandle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  
  // This ref persists across renders to track the last time a swap occurred
  const lastReorderTime = useRef<number>(0);

  // --- Grouping Logic: Transform raw segments into DisplayItems (Modules) ---
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    const processedIds = new Set<string>();

    segments.forEach(seg => {
        if (processedIds.has(seg.num_of_node)) return;

        if (seg.groupType === 'register') {
            // Find all segments that belong to this register (Same Latch/STCP PIN)
            const siblings = segments.filter(s => s.groupType === 'register' && s.gpio === seg.gpio);
            siblings.forEach(s => processedIds.add(s.num_of_node));
            
            items.push({ 
                type: 'register_group', 
                id: `reg-${seg.gpio}`, // Unique ID for the container
                segments: siblings 
            });
        } 
        // Note: Weather is essentially a single segment in current data structure, so treated as single
        else {
            processedIds.add(seg.num_of_node);
            items.push({ type: 'single', id: seg.num_of_node, segment: seg });
        }
    });

    return items;
  }, [segments]);


  const moveItem = (fromIndex: number, toIndex: number) => {
    // 1. Reorder the DisplayItems
    const newItems = [...displayItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    // 2. Flatten back to Segments Array for Storage
    const flattenedSegments: Segment[] = [];
    newItems.forEach(item => {
        if (item.type === 'single') {
            flattenedSegments.push(item.segment);
        } else {
            flattenedSegments.push(...item.segments);
        }
    });

    onReorder(flattenedSegments);
  };

  // Memoize style to prevent object creation on render
  const containerStyle = useMemo(() => ({
    borderColor: `${settings.primaryColor}50`, // Stronger border
    // Minimal tint, rely on backdrop-filter for the "glass" look
    backgroundColor: `${settings.primaryColor}03`, 
  }), [settings.primaryColor]);

  const labelStyle = useMemo(() => ({
    color: 'var(--primary)',
    borderColor: `${settings.primaryColor}40`,
    backgroundColor: `${settings.primaryColor}15`
  }), [settings.primaryColor]);

  // Determine Grid Layout based on Item count
  // Registers take up full space (col-span-2) usually, but we keep generic grid for now
  const gridClass = displayItems.length === 2 
    ? "grid-cols-1" 
    : "grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6";
    
  // Smart Font Class for Zone Name
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);

  return (
    <div 
      className={cn(
        "h-full relative border-2 border-dashed rounded-xl md:rounded-[2rem] p-3 pt-6 md:p-8 transition-all duration-500",
        // EFFECTS LAYER:
        // 1. bg-background/30: Stronger glass tint (Increased from 20).
        // 2. backdrop-blur-[8px]: Stronger blur (Increased from 3px) for out-of-focus look.
        // 3. backdrop-grayscale & backdrop-saturate-0: Complete removal of color (Dead Color Effect).
        "bg-background/30 backdrop-blur-[8px] backdrop-grayscale backdrop-saturate-0 shadow-xl"
      )}
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
         <GroupHeader name={name} count={displayItems.length} />
      </div>
      
      <div 
        ref={containerRef}
        className={cn(
          "grid relative min-h-[50px] md:min-h-[100px]",
          gridClass
        )}
      >
        <AnimatePresence mode="popLayout">
          {displayItems.map((item, index) => {
            const isLastAndOdd = displayItems.length % 2 !== 0 && index === displayItems.length - 1;
            
            return (
              <DraggableDisplayItem 
                key={item.id}
                item={item}
                index={index}
                containerRef={containerRef}
                moveItem={moveItem}
                onRemove={onRemove}
                onToggle={onToggle}
                onPWMChange={onPWMChange}
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
