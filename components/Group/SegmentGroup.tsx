
import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Hash, CornerRightDown, Activity } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { DisplaySegment } from '../Segment/DisplaySegment';
import { RegisterSubGroup } from './RegisterSubGroup';
import { Segment } from '../../types/index';
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

  // Shared Drag Handle Props
  const dragHandleProps = {
    className: "cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-none transition-colors text-muted-foreground hover:text-primary border-r border-border/50 h-full flex items-center justify-center",
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

  const handleRemove = () => {
     if (item.type === 'single') {
         onRemove(item.id);
     } else {
         item.segments.forEach(s => onRemove(s.num_of_node));
     }
  };

  const itemVariants = {
    idle: { scale: 1, opacity: 1, zIndex: 1 },
    dragging: { 
        scale: 1.02, 
        zIndex: 50, 
        opacity: 0.9,
        cursor: "grabbing" 
    },
    exit: { 
        scale: 0, 
        opacity: 0, 
        transition: { duration: 0.2 } 
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
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
      onDragStart={onDragStart}
      onDrag={handleDrag}
      onDragEnd={(event: any, info: any) => {
        onDragEnd?.();
        const thresholdY = window.innerHeight - 110;
        if (info.point.y > thresholdY) {
          handleRemove();
        }
      }}
      className={cn("segment_area relative h-full", className)}
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
  const lastReorderTime = useRef<number>(0);

  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    const processedIds = new Set<string>();

    segments.forEach(seg => {
        if (processedIds.has(seg.num_of_node)) return;

        if (seg.groupType === 'register') {
            const siblings = segments.filter(s => s.groupType === 'register' && s.gpio === seg.gpio);
            siblings.forEach(s => processedIds.add(s.num_of_node));
            items.push({ 
                type: 'register_group', 
                id: `reg-${seg.gpio}`,
                segments: siblings 
            });
        } 
        else {
            processedIds.add(seg.num_of_node);
            items.push({ type: 'single', id: seg.num_of_node, segment: seg });
        }
    });

    return items;
  }, [segments]);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    const newItems = [...displayItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

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

  const gridClass = displayItems.length === 2 
    ? "grid-cols-1" 
    : "grid-cols-1 lg:grid-cols-2 gap-4";
    
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);
  
  // Use cursor color as the tint source
  const accentColor = settings.cursorColor || '#daa520';

  // --- ISLAND ARCHITECTURE SHAPES ---
  const CLIP_HEADER = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
  const CLIP_BODY = "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))";

  return (
    <div className="flex flex-col gap-3 h-full group/panel">
      
      {/* 
          ISLAND 1: THE COMMAND BRIDGE (Header)
      */}
      <div className="relative shrink-0 filter drop-shadow-md">
          {/* Border Layer */}
          <div className="absolute inset-0 bg-border/40 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_HEADER }} />
          
          {/* Content Layer (Glass) */}
          <div className="relative h-12 flex items-center justify-between px-4 overflow-hidden backdrop-blur-xl" style={{ clipPath: CLIP_HEADER, margin: '1px' }}>
             
             {/* Glass Background & Tint */}
             <div className="absolute inset-0 bg-background/60 dark:bg-[#0c0c0e]/60 transition-colors" />
             <div className="absolute inset-0 opacity-10" style={{ backgroundColor: accentColor }} />

             {/* Decorative Scanline */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 z-20" />

             <div className="flex items-center gap-3 relative z-10">
                {dragHandle && (
                   <div className="text-muted-foreground hover:text-primary transition-colors cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 border-r border-white/10 pr-3">
                      {dragHandle}
                   </div>
                )}
                
                <div className="flex flex-col justify-center">
                    <span className="text-[7px] font-mono font-bold text-primary/60 uppercase tracking-widest leading-none mb-0.5 flex items-center gap-1">
                        <Activity size={8} /> ZONE ID
                    </span>
                    <span className={cn(
                        "text-sm font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2 drop-shadow-sm",
                        zoneFontClass
                    )}>
                       {name}
                    </span>
                </div>
             </div>

             <div className="flex items-center gap-2 relative z-10">
                 <div className="hidden sm:flex items-center gap-1">
                    <div className="w-1 h-1 bg-primary/50 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-primary/20 rounded-full" />
                    <div className="w-1 h-1 bg-primary/20 rounded-full" />
                 </div>
                 <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-muted-foreground bg-black/10 dark:bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                     <Hash size={10} />
                     <span>{displayItems.length}</span>
                 </div>
             </div>
          </div>
      </div>

      {/* 
          ISLAND 2: THE CARGO HOLD (Content Body)
      */}
      <div className="relative flex-1 filter drop-shadow-lg">
          {/* Border Layer */}
          <div className="absolute inset-0 bg-border/40 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_BODY }} />

          {/* Content Layer (Glass) */}
          <div className="relative h-full p-[1px] backdrop-blur-xl" style={{ clipPath: CLIP_BODY, margin: '1px' }}>
              
              {/* Glass Background (More Transparent: 30-40%) */}
              <div className="absolute inset-0 bg-background/40 dark:bg-[#0c0c0e]/40 transition-colors" />
              
              {/* Tint Layer (The requested "Third Color" tint) */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundColor: accentColor }} />

              {/* Inner Background Pattern (Stripes) */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[length:24px_24px]" />

              <div className="p-4 md:p-5 relative z-10 h-full">
                <div 
                    ref={containerRef}
                    className={cn(
                    "grid relative min-h-[50px]",
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

              {/* Decorative Corner Accent (Bottom Right) */}
              <div className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-2 opacity-40 pointer-events-none">
                    <CornerRightDown size={14} className="text-primary" />
              </div>
          </div>
      </div>
    </div>
  );
});
