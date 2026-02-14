
import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Hash } from 'lucide-react';
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
  | { type: 'register_group'; id: string; segments: Segment[] };

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

  // Shared Drag Handle Props - Styled for the new Card look
  const dragHandleProps = {
    className: "cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground",
    onPointerDown: (e: any) => controls.start(e),
    style: { touchAction: 'none' } as React.CSSProperties
  };

  const DragIcon = <GripVertical size={14} />;

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
      
      // Dynamic Component Selection based on Segment Type
      let ComponentToRender = (
         <CustomSegment 
            segment={seg} 
            onToggle={() => onToggle(seg.num_of_node)} 
            onPWMChange={(val) => onPWMChange(seg.num_of_node, val)} 
         />
      );

      if (seg.segType === 'DHT') {
         ComponentToRender = <WeatherSegment segment={seg} />;
      } else if (seg.segType === 'OLED' || seg.segType === 'CharLCD') {
         ComponentToRender = <DisplaySegment segment={seg} />;
      } else if (seg.segType === 'Input-0-1' || seg.groupType === 'input') {
         ComponentToRender = <InputSegment segment={seg} />;
      }

      content = (
        <SegmentCard 
            gpio={seg.gpio || 0} 
            label={seg.name}
            dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
        >
            {ComponentToRender}
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

  // Animation Variants for Segments
  const itemVariants = {
    idle: { scale: 1, opacity: 1, rotate: 0, filter: "brightness(1) blur(0px)" },
    // On Drag: Tilt slightly, scale up, energy glow shadow
    dragging: { 
        scale: 1.05, 
        zIndex: 50, 
        opacity: 1,
        rotate: 2, // Slight tilt for physics feel
        boxShadow: "0 20px 40px -5px rgba(var(--primary), 0.3)", 
        cursor: "grabbing" 
    },
    // On Delete: "De-rez" effect (Bright flash, then implode)
    exit: { 
        scale: 0, 
        opacity: 0, 
        filter: "brightness(2) blur(8px)", // Flash burnout effect
        transition: { duration: 0.25, ease: "circIn" } 
    }
  };

  return (
    <MotionDiv 
      key={uniqueId}
      layout="position" 
      drag
      dragListener={false} 
      dragControls={controls} 
      dragSnapToOrigin
      dragElastic={0.1}
      
      variants={itemVariants}
      initial="idle"
      animate="idle"
      exit="exit"
      whileDrag="dragging"
      // Snappy physics for return
      transition={{ type: "spring", stiffness: 450, damping: 35 }}

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
        else {
            // All other types (Custom, Weather, Display, Input) are treated as single items in the grid
            processedIds.add(seg.num_of_node);
            items.push({ type: 'single', id: seg.num_of_node, segment: seg });
        }
    });

    return items;
  }, [segments]);


  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
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
  }, [displayItems, onReorder]);

  // Determine Grid Layout based on Item count
  const gridClass = displayItems.length === 2 
    ? "grid-cols-1" 
    : "grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5";
    
  // Smart Font Class for Zone Name
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);

  return (
    <div 
      className={cn(
        "h-full relative transition-all duration-500",
        // Base Panel Styling
        "bg-secondary/5 dark:bg-[#0c0c0e]/60 backdrop-blur-xl",
        "rounded-[20px]",
        "border border-white/10 shadow-lg",
        // Inner padding structure
        "p-1 pt-12 pb-4"
      )}
    >
      {/* 
         --- TECHNICAL HUD HEADER --- 
         This creates the "Tag" look at the top left of the box.
      */}
      <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-white/5 dark:bg-white/[0.02] flex items-center justify-between px-4 rounded-t-[20px]">
         <div className="flex items-center gap-3">
            {dragHandle && (
               <div className="text-muted-foreground hover:text-primary transition-colors cursor-grab active:cursor-grabbing">
                  {dragHandle}
               </div>
            )}
            <div className="h-4 w-px bg-white/10" />
            <span className={cn(
                "text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-foreground/80 flex items-center gap-2",
                zoneFontClass
            )}>
               <span className="text-primary opacity-60">ZONE:</span>
               {name}
            </span>
         </div>

         {/* Technical Decor (Top Right) */}
         <div className="flex items-center gap-1 opacity-20">
             <div className="w-1 h-1 bg-foreground rounded-full" />
             <div className="w-1 h-1 bg-foreground rounded-full" />
             <div className="w-10 h-px bg-foreground" />
         </div>
      </div>

      {/* Main Content Area */}
      <div className="px-3 md:px-4">
        {/* Optional Sub-header statistics (count) */}
        <div className="flex justify-end mb-4 pr-1">
             <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-muted-foreground/50 bg-black/10 dark:bg-white/5 px-2 py-0.5 rounded">
                 <Hash size={10} />
                 <span>{displayItems.length} MODULES</span>
             </div>
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

      {/* Decorative Corner Brackets (HUD style) */}
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/20 rounded-br-[20px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/20 rounded-bl-[20px] pointer-events-none" />
    </div>
  );
});
