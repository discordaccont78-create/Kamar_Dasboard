
import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Hash, CornerRightDown, Activity, Cpu, Layers, Columns, LayoutGrid, Square, RectangleHorizontal } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { DisplaySegment } from '../Segment/DisplaySegment';
import { RegisterSubGroup } from './RegisterSubGroup';
import { Segment } from '../../types/index';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';
import { useSegments } from '../../lib/store/segments'; 

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
  onAddSegment?: (groupName: string) => void; 
  dragHandle?: React.ReactNode; 
}

const MotionDiv = motion.div as any;

// Define a Display Item which can be a single segment or a Sub-Group
type DisplayItem = 
  | { type: 'single'; id: string; segment: Segment }
  | { type: 'register_group'; id: string; segments: Segment[] };

export type ItemPosition = 
  | 'solo' 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'middle-left' | 'middle-center' | 'middle-right' | 'middle'
  | 'bottom-left' | 'bottom-center' | 'bottom-right' 
  | 'bottom-solo';

// Wrapper component to handle individual drag controls - Memoized
const DraggableDisplayItem = React.memo(({ 
  item, 
  index, 
  position,
  isLast, 
  containerRef, 
  moveItem, 
  onRemove, 
  onToggle, 
  onPWMChange, 
  onDragStart, 
  onDragEnd, 
  lastReorderTime,
  className,
  segmentId,
  onClick // for Spacers
}: {
  item: DisplayItem,
  index: number,
  position: ItemPosition,
  isLast: boolean,
  containerRef: React.RefObject<HTMLDivElement>,
  moveItem: (fromIndex: number, toIndex: number) => void,
  onRemove: (id: string) => void,
  onToggle: (id: string) => void,
  onPWMChange: (id: string, val: number) => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
  lastReorderTime: React.MutableRefObject<number>,
  className?: string,
  segmentId: string,
  onClick?: () => void
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
    // CRITICAL FIX: Query BOTH real segments AND ghost areas to allow dragging into empty slots
    const items = Array.from(containerRef.current.querySelectorAll('.segment_area, .ghost_area')) as HTMLElement[];
    
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

  if (item.type === 'register_group') {
      content = (
          <RegisterSubGroup 
              segments={item.segments} 
              onToggle={onToggle}
              position={position}
              isLast={isLast}
              dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
          />
      );
  } else if (item.type === 'single') {
      const seg = item.segment;
      const isSpacer = seg.segType === 'Empty';

      if (isSpacer) {
          // Spacer Logic: Render as Empty Slot but Draggable
          content = (
            <SegmentCard 
                gpio={0} 
                label="SPACER"
                position={position}
                isLast={isLast}
                segmentId={seg.num_of_node}
                dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
                variant="spacer"
                onRemove={() => onRemove(seg.num_of_node)}
                onClick={onClick} // Allow replacing spacer
            />
          );
      } else {
          // Real Segment Logic
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
                position={position}
                isLast={isLast}
                segmentId={seg.num_of_node}
                dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
            >
                {ComponentToRender}
            </SegmentCard>
          );
      }
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
      key={segmentId}
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
      className={cn("segment_area relative h-full", className)} // Used for drag targets
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
  onAddSegment,
  dragHandle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  const { groups, updateGroup, addGroup, addSegment, removeSegment } = useSegments(); 
  const lastReorderTime = useRef<number>(0);

  // Find current group config to get column count
  const groupConfig = groups.find(g => g.id === name) || { id: name, name: name, order: 0, columnCount: 2 };
  const cols = groupConfig.columnCount || 2;

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

  // --- GHOST SLOT CALCULATION ---
  // If cols > 1, we fill the empty space in the grid row with ghost slots.
  const ghostSlots = useMemo(() => {
      if (cols === 1) return 0;
      const remainder = displayItems.length % cols;
      if (remainder === 0) return 0; // Perfectly full rows
      return cols - remainder; // Needed slots to fill row
  }, [displayItems.length, cols]);

  const totalGridItems = displayItems.length + ghostSlots;

  // --- SMART GAP FILLER LOGIC ---
  const handleGhostClick = (ghostRelativeIndex: number) => {
      // 1. Create Spacers for any gaps BEFORE the clicked one (if applicable)
      for (let i = 0; i < ghostRelativeIndex; i++) {
          addSegment({
              num_of_node: `spacer-${Date.now()}-${i}`,
              name: 'Empty Slot',
              groupId: name,
              groupType: 'custom',
              segType: 'Empty',
              gpio: 0,
              is_led_on: 'off',
              val_of_slide: 0
          });
      }
      
      // 2. Create a Spacer for the clicked slot itself immediately
      // This ensures the grid structure is preserved if they close the menu
      addSegment({
          num_of_node: `spacer-${Date.now()}-clicked`,
          name: 'Empty Slot',
          groupId: name,
          groupType: 'custom',
          segType: 'Empty',
          gpio: 0,
          is_led_on: 'off',
          val_of_slide: 0
      });

      // 3. Open the menu (user can replace the spacer by adding a real device, or just keep it)
      if (onAddSegment) onAddSegment(name);
  };

  // Replacement logic for existing spacers
  const handleSpacerReplace = (spacerId: string) => {
      removeSegment(spacerId);
      if (onAddSegment) onAddSegment(name);
  };

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    let currentList: any[] = [...displayItems];

    // Scenario: Moving a real item INTO a Ghost slot.
    // e.g. [Real_A] [Ghost] -> Drag A to Ghost -> [Spacer] [Real_A]
    // The previous spot of Real_A effectively becomes empty (Spacer).
    if (toIndex >= currentList.length) {
        const itemToMove = currentList[fromIndex];
        
        // 1. Insert Spacers to pad up to the destination
        // Note: The destination index is relative to the total grid including ghosts.
        const neededSpacers = (toIndex - currentList.length) + 1;
        
        // Before we move, we need to leave a spacer behind at the Source Index
        // This ensures the grid maintains structure (like moving a piece on a board)
        const spacerLeftBehind: Segment = {
            num_of_node: `left-behind-${Date.now()}`,
            name: 'Empty Slot',
            groupId: name,
            groupType: 'custom',
            segType: 'Empty',
            gpio: 0,
            is_led_on: 'off',
            val_of_slide: 0
        };
        
        // Convert item at source to spacer
        currentList[fromIndex] = { type: 'single', id: spacerLeftBehind.num_of_node, segment: spacerLeftBehind };
        
        // 2. Fill intermediate gaps if any (jumping over ghosts)
        for(let i = 0; i < neededSpacers - 1; i++) {
             const intermediateSpacer: Segment = {
                num_of_node: `gap-fill-${Date.now()}-${i}`,
                name: 'Empty Slot',
                groupId: name,
                groupType: 'custom',
                segType: 'Empty',
                gpio: 0,
                is_led_on: 'off',
                val_of_slide: 0
            };
            currentList.push({ type: 'single', id: intermediateSpacer.num_of_node, segment: intermediateSpacer });
        }

        // 3. Place the moved item at the END (Target)
        currentList.push(itemToMove);
    } 
    else {
        // Standard Swap (Drag Real to Real)
        const [movedItem] = currentList.splice(fromIndex, 1);
        currentList.splice(toIndex, 0, movedItem);
    }

    const flattenedSegments: Segment[] = [];
    currentList.forEach(item => {
        if (item.type === 'single') {
            flattenedSegments.push(item.segment);
        } else {
            flattenedSegments.push(...item.segments);
        }
    });

    onReorder(flattenedSegments);
  }, [displayItems, onReorder, name]);

  // --- DYNAMIC GRID STYLING ---
  const gridClass = useMemo(() => {
      if (cols === 1) return "grid-cols-1 gap-1.5";
      if (cols === 2) return "grid-cols-1 lg:grid-cols-2 gap-1.5";
      if (cols === 3) return "grid-cols-1 lg:grid-cols-3 gap-1.5";
      return "grid-cols-1 lg:grid-cols-2 gap-1.5"; 
  }, [cols]);
    
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);
  const accentColor = settings.cursorColor || '#daa520';

  const CLIP_HEADER = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
  const CLIP_BODY = "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))";

  // --- POSITION CALCULATOR V6 (Grid + Ghosts) ---
  const getGridPosition = (index: number, total: number, columns: number): ItemPosition => {
      if (total === 1) return 'solo';

      if (columns === 1) {
          if (index === 0) return 'top-right'; 
          if (index === total - 1) return 'bottom-left'; 
          return 'middle';
      }

      const row = Math.floor(index / columns);
      const col = index % columns;
      const totalRows = Math.ceil(total / columns);
      
      const isFirstRow = row === 0;
      const isLastRow = row === totalRows - 1;
      const isFirstCol = col === 0;
      const isLastCol = col === columns - 1;

      if (isLastRow && isFirstCol) return 'bottom-left';
      if (isFirstRow && isLastCol) return 'top-right';
      if (isFirstRow && isFirstCol) return 'top-left';
      if (isLastRow && isLastCol) return 'bottom-right';

      if (isFirstRow) return 'top-center';
      if (isLastRow) return 'bottom-center';
      if (isFirstCol) return 'middle-left';
      if (isLastCol) return 'middle-right';
      
      return 'middle-center';
  };

  const handleUpdateCols = (c: 1 | 2 | 3) => {
      const existingGroup = groups.find(g => g.id === name);
      if (existingGroup) {
          updateGroup(name, { columnCount: c });
      } else {
          addGroup({
              id: name,
              name: name,
              order: groups.length, 
              columnCount: c,
              collapsed: false
          });
      }
  };

  return (
    <div className="flex flex-col gap-3 h-full group/panel">
      {/* HEADER */}
      <div className="relative shrink-0 filter drop-shadow-md group/header">
          <div 
            className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/header:bg-primary/40" 
            style={{ clipPath: CLIP_HEADER }} 
          />
          <div 
            className="relative h-14 bg-secondary/90 dark:bg-[#121214]/95 backdrop-blur-xl flex items-stretch justify-between overflow-hidden" 
            style={{ clipPath: CLIP_HEADER, margin: '1px' }}
          >
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/50 group-hover/header:bg-primary transition-colors shadow-[0_0_10px_var(--primary)] z-20" />
             <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] pointer-events-none" />

             <div className="flex items-center gap-4 pl-0 relative z-10 h-full">
                {dragHandle && (
                   <div className="h-full flex items-center justify-center pl-5 pr-4 border-r border-white/5 bg-white/5 hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing group/handle">
                      {dragHandle}
                   </div>
                )}
                
                <div className="flex flex-col justify-center h-full py-1.5 gap-0.5 pl-2">
                    <div className="flex items-center gap-1.5 text-[7px] font-mono font-bold uppercase tracking-widest text-primary/80">
                        <Layers size={8} />
                        <span>ZONE_ID</span>
                        <span className="w-8 h-px bg-primary/30" />
                    </div>

                    <span className={cn(
                        "text-base md:text-lg font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2 drop-shadow-sm leading-none",
                        zoneFontClass
                    )}>
                       {name}
                    </span>
                </div>
             </div>

             <div className="flex items-center h-full pr-5 relative z-10">
                 {/* COLUMN CONTROLS */}
                 <div className="hidden lg:flex items-center gap-1 mr-4 bg-black/10 dark:bg-white/5 p-1 rounded-md border border-white/5">
                    <button onClick={() => handleUpdateCols(1)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 1 ? "text-primary bg-white/10" : "text-muted-foreground")} title="1 Column"><RectangleHorizontal size={14} /></button>
                    <button onClick={() => handleUpdateCols(2)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 2 ? "text-primary bg-white/10" : "text-muted-foreground")} title="2 Columns"><Columns size={14} /></button>
                    <button onClick={() => handleUpdateCols(3)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 3 ? "text-primary bg-white/10" : "text-muted-foreground")} title="3 Columns"><LayoutGrid size={14} /></button>
                 </div>

                 <div className="h-full w-8 relative flex items-center justify-center opacity-20">
                    <div className="h-8 w-px bg-foreground rotate-12" />
                 </div>

                 <div className="flex flex-col items-end justify-center mr-3">
                     <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">
                        MODULES
                     </span>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-foreground tracking-tight leading-none">
                            {displayItems.length.toString().padStart(2, '0')}
                        </span>
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-none transition-colors duration-500",
                            displayItems.length > 0 ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-muted"
                        )} />
                     </div>
                 </div>

                 <div 
                    className="h-9 w-9 bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover/header:text-primary group-hover/header:bg-primary/10 transition-all relative"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                 >
                    <Cpu size={16} strokeWidth={2} />
                 </div>
             </div>
             
             <div 
                className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-[6px] pointer-events-none opacity-30"
                style={{ backgroundImage: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)` }}
             />
          </div>
      </div>

      {/* BODY */}
      <div className="relative flex-1 filter drop-shadow-lg">
          <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_BODY }} />
          <div className="relative h-full bg-background/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl p-[1px] overflow-hidden" style={{ clipPath: CLIP_BODY, margin: '1px' }}>
              
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover/panel:bg-primary/60 transition-colors shadow-[0_0_15px_var(--primary)] z-20 opacity-80" />
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

              <div className="p-4 md:p-5 relative z-10 h-full">
                <div ref={containerRef} className={cn("grid relative min-h-[50px]", gridClass)}>
                    <AnimatePresence mode="popLayout">
                    {/* Render Real Items */}
                    {displayItems.map((item, index) => {
                        const position = getGridPosition(index, totalGridItems, cols);
                        const isLast = index === totalGridItems - 1; 

                        return (
                        <DraggableDisplayItem 
                            key={item.id}
                            item={item}
                            index={index}
                            position={position}
                            isLast={isLast}
                            segmentId={item.id}
                            containerRef={containerRef}
                            moveItem={moveItem}
                            onRemove={onRemove}
                            onToggle={onToggle}
                            onPWMChange={onPWMChange}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            lastReorderTime={lastReorderTime}
                            onClick={item.type === 'single' && item.segment.segType === 'Empty' ? () => handleSpacerReplace(item.id) : undefined}
                        />
                        );
                    })}
                    
                    {/* Render Ghost Items (Now visually identical to Spacers) */}
                    {Array.from({ length: ghostSlots }).map((_, i) => {
                        const globalIndex = displayItems.length + i;
                        const position = getGridPosition(globalIndex, totalGridItems, cols);
                        const isLast = globalIndex === totalGridItems - 1;

                        return (
                            <motion.div
                                key={`ghost-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                // CRITICAL FIX: Include 'ghost_area' class so handleDrag detects it as a valid drop target
                                className="ghost_area hidden lg:block" 
                            >
                                <SegmentCard 
                                    gpio={0}
                                    label="EMPTY SLOT" // Unified Label
                                    segmentId={`ghost-${i}`}
                                    position={position}
                                    isLast={isLast}
                                    variant="ghost"
                                    onClick={() => handleGhostClick(i)} 
                                />
                            </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none opacity-40" style={{ backgroundImage: `linear-gradient(135deg, transparent 60%, ${accentColor} 60%)` }} />
              <div className="absolute bottom-1 right-1 p-1 opacity-80 pointer-events-none text-primary/80">
                    <CornerRightDown size={12} />
              </div>
          </div>
      </div>
    </div>
  );
});
