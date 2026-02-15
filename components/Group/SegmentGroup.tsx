
import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Hash, CornerRightDown, Activity, Cpu, Layers } from 'lucide-react';
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
          Re-imagined as a high-tech "Control Unit" block.
      */}
      <div className="relative shrink-0 filter drop-shadow-md group/header">
          {/* Border Glow Layer (Reacts to Hover) */}
          <div 
            className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/header:bg-primary/40" 
            style={{ clipPath: CLIP_HEADER }} 
          />
          
          {/* Main Surface Layer */}
          <div 
            className="relative h-14 bg-secondary/90 dark:bg-[#121214]/95 backdrop-blur-xl flex items-stretch justify-between overflow-hidden" 
            style={{ clipPath: CLIP_HEADER, margin: '1px' }}
          >
             {/* 1. Neon Power Strip (Left Edge) */}
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/50 group-hover/header:bg-primary transition-colors shadow-[0_0_10px_var(--primary)] z-20" />

             {/* 2. Technical Background Pattern (Stripes) */}
             <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] pointer-events-none" />

             {/* LEFT SECTION: Identity & Drag */}
             <div className="flex items-center gap-4 pl-0 relative z-10 h-full">
                
                {/* 
                    Custom Grip Handle Zone
                    Correctly renders the passed `dragHandle` prop.
                */}
                {dragHandle && (
                   <div className="h-full flex items-center justify-center pl-5 pr-4 border-r border-white/5 bg-white/5 hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing group/handle">
                      {dragHandle}
                   </div>
                )}
                
                {/* Zone Info Block */}
                <div className="flex flex-col justify-center h-full py-1.5 gap-0.5 pl-2">
                    {/* Top Label (Micro) */}
                    <div className="flex items-center gap-1.5 text-[7px] font-mono font-bold uppercase tracking-widest text-primary/80">
                        <Layers size={8} />
                        <span>ZONE_ID</span>
                        <span className="w-8 h-px bg-primary/30" />
                    </div>

                    {/* Main Name */}
                    <span className={cn(
                        "text-base md:text-lg font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2 drop-shadow-sm leading-none",
                        zoneFontClass
                    )}>
                       {name}
                    </span>
                </div>
             </div>

             {/* RIGHT SECTION: Status Monitor - INTEGRATED STYLE */}
             <div className="flex items-center h-full pr-5 relative z-10">
                 
                 {/* Angled Divider */}
                 <div className="h-full w-8 relative flex items-center justify-center opacity-20">
                    <div className="h-8 w-px bg-foreground rotate-12" />
                 </div>

                 {/* Data Readout */}
                 <div className="flex flex-col items-end justify-center mr-3">
                     <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">
                        MODULES
                     </span>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-foreground tracking-tight leading-none">
                            {displayItems.length.toString().padStart(2, '0')}
                        </span>
                        {/* Status Dot */}
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                            displayItems.length > 0 ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-muted"
                        )} />
                     </div>
                 </div>

                 {/* Icon Interface */}
                 <div className="h-9 w-9 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center border border-white/10 text-muted-foreground group-hover/header:text-primary group-hover/header:border-primary/20 transition-all">
                    <Cpu size={16} strokeWidth={2} />
                 </div>
             </div>
             
             {/* Bottom Right Cut Accent */}
             <div 
                className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-[6px] pointer-events-none opacity-30"
                style={{ 
                    backgroundImage: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)` 
                }}
             />
          </div>
      </div>

      {/* 
          ISLAND 2: THE CARGO HOLD (Content Body)
          Solid tech look with grid pattern.
      */}
      <div className="relative flex-1 filter drop-shadow-lg">
          {/* Outer Border Layer */}
          <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_BODY }} />

          {/* Inner Content Layer (High Opacity for Solid Look) */}
          <div className="relative h-full bg-background/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl p-[1px] overflow-hidden" style={{ clipPath: CLIP_BODY, margin: '1px' }}>
              
              {/* Internal Tech Grid Pattern (Very Subtle) */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                    backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }} 
              />

              {/* Ambient Top Light */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

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
              <div className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-2 opacity-60 pointer-events-none">
                    <CornerRightDown size={14} className="text-primary" />
              </div>
          </div>
      </div>
    </div>
  );
});
