
import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Columns, LayoutGrid, RectangleHorizontal, CornerRightDown, Cpu, ChevronLeft } from 'lucide-react';
import { Segment } from '../../types/index';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';
import { useSegments } from '../../lib/store/segments'; 
import { DraggableDisplayItem, DisplayItem, ItemPosition } from './DraggableDisplayItem';

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
  onAddSegment?: (groupName: string, replaceId?: string) => void; 
  dragHandle?: React.ReactNode; 
}

const CLIP_HEADER = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
// Updated CLIP_BODY: Added a notch in the vertical center of the right side
const CLIP_BODY = "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% calc(50% - 15px), calc(100% - 15px) 50%, 100% calc(50% + 15px), 100% 100%, 20px 100%, 0 calc(100% - 20px))";

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
  const { groups, updateGroup, addGroup, addSegment } = useSegments(); 
  const lastReorderTime = useRef<number>(0);

  const groupConfig = groups.find(g => g.id === name) || { id: name, name: name, order: 0, columnCount: 2 };
  const cols = groupConfig.columnCount || 2;

  // 1. Build Real Items List
  const realItems = useMemo(() => {
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

  // 2. Filter Trailing Spacers Logic
  const filteredItems = useMemo(() => {
      let lastContentIndex = -1;
      
      for (let i = realItems.length - 1; i >= 0; i--) {
          const item = realItems[i];
          const isSpacer = item.type === 'single' && item.segment.segType === 'Empty';
          if (!isSpacer) {
              lastContentIndex = i;
              break;
          }
      }

      if (lastContentIndex === -1) return realItems;
      const maxRow = Math.floor(lastContentIndex / cols);

      return realItems.filter((item, index) => {
          const isSpacer = item.type === 'single' && item.segment.segType === 'Empty';
          if (!isSpacer) return true;
          const itemRow = Math.floor(index / cols);
          return itemRow <= maxRow;
      });
  }, [realItems, cols]);

  // 3. Fill Remainder with Ghosts
  const fullDisplayList = useMemo(() => {
      const items = [...filteredItems];
      if (cols === 1) return items;
      
      const remainder = items.length % cols;
      if (remainder === 0) return items; 
      
      const ghostCount = cols - remainder;
      for (let i = 0; i < ghostCount; i++) {
          items.push({ type: 'ghost', id: `ghost-${i}`, index: i });
      }
      return items;
  }, [filteredItems, cols]);

  const totalGridItems = fullDisplayList.length;

  const handleGhostClick = (ghostRelativeIndex: number) => {
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
      
      const clickedSpacerId = `spacer-${Date.now()}-clicked`;
      addSegment({
          num_of_node: clickedSpacerId,
          name: 'Empty Slot',
          groupId: name,
          groupType: 'custom',
          segType: 'Empty',
          gpio: 0,
          is_led_on: 'off',
          val_of_slide: 0
      });

      if (onAddSegment) onAddSegment(name, clickedSpacerId);
  };

  const handleSpacerReplace = (spacerId: string) => {
      if (onAddSegment) onAddSegment(name, spacerId);
  };

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    let currentList: any[] = [...fullDisplayList];

    if (fromIndex >= currentList.length || toIndex >= currentList.length) return;

    const materializeGhost = (idx: number): Segment => {
        return {
            num_of_node: `auto-spacer-${Date.now()}-${Math.random()}`,
            name: 'Empty Slot',
            groupId: name,
            groupType: 'custom',
            segType: 'Empty',
            gpio: 0,
            is_led_on: 'off',
            val_of_slide: 0
        };
    };

    if (currentList[fromIndex].type === 'ghost') {
        const spacer = materializeGhost(fromIndex);
        currentList[fromIndex] = { type: 'single', id: spacer.num_of_node, segment: spacer };
    }

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);

    let lastRealIndex = -1;
    for (let i = currentList.length - 1; i >= 0; i--) {
        if (currentList[i].type !== 'ghost') {
            lastRealIndex = i;
            break;
        }
    }

    for (let i = 0; i < lastRealIndex; i++) {
        if (currentList[i].type === 'ghost') {
            const spacer = materializeGhost(i);
            currentList[i] = { type: 'single', id: spacer.num_of_node, segment: spacer };
        }
    }

    const finalSegments: Segment[] = [];
    currentList.forEach(item => {
        if (item.type === 'single') {
            finalSegments.push(item.segment);
        } else if (item.type === 'register_group') {
            finalSegments.push(...item.segments);
        }
    });

    onReorder(finalSegments);
  }, [fullDisplayList, onReorder, name]);

  const gridClass = useMemo(() => {
      if (cols === 1) return "grid-cols-1 gap-1.5";
      if (cols === 2) return "grid-cols-1 md:grid-cols-2 gap-1.5";
      if (cols === 3) return "grid-cols-1 md:grid-cols-3 gap-1.5";
      return "grid-cols-1 md:grid-cols-2 gap-1.5"; 
  }, [cols]);
    
  const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);
  const accentColor = settings.cursorColor || '#daa520';

  // --- UPDATED GRID POSITION LOGIC FOR SPLIT NOTCH ---
  const getGridPosition = (index: number, total: number, columns: number): ItemPosition => {
      if (total === 1) return 'solo';

      const row = Math.floor(index / columns);
      const col = index % columns;
      const totalRows = Math.ceil(total / columns);
      const isLastCol = col === columns - 1;

      // RIGHT COLUMN LOGIC (The Notch)
      if (isLastCol) {
          if (totalRows % 2 !== 0) {
              // Odd Rows: Middle one gets standard Middle-Right notch
              const mid = Math.floor(totalRows / 2);
              if (row === mid) return 'middle-right';
          } else {
              // Even Rows: Split notch logic
              const splitLine = totalRows / 2;
              
              // Upper Item of the notch
              if (row === splitLine - 1) {
                  // If it's the very first row, it combines Top-Right + Split Bottom
                  if (row === 0) return 'top-right-split';
                  return 'middle-right-split-top';
              }
              // Lower Item of the notch
              if (row === splitLine) {
                  // If it's the very last row, it combines Bottom-Right + Split Top
                  if (row === totalRows - 1) return 'bottom-right-split';
                  return 'middle-right-split-bottom';
              }
          }
      }

      // STANDARD CORNERS
      const isFirstRow = row === 0;
      const isLastRow = row === totalRows - 1;
      const isFirstCol = col === 0;

      if (isLastRow && isFirstCol) return 'bottom-left';
      if (isFirstRow && isLastCol) return 'top-right'; // Fallback if not involved in split
      if (isFirstRow && isFirstCol) return 'top-left';
      if (isLastRow && isLastCol) return 'bottom-right'; // Fallback if not involved in split

      if (isFirstRow) return 'top-center';
      if (isLastRow) return 'bottom-center';
      if (isFirstCol) return 'middle-left';
      if (isLastCol) return 'middle-right'; // Fallback
      
      return 'middle-center';
  };

  const handleUpdateCols = (c: 1 | 2 | 3) => {
      const existingGroup = groups.find(g => g.id === name);
      if (existingGroup) {
          updateGroup(name, { columnCount: c });
      } else {
          addGroup({ id: name, name: name, order: groups.length, columnCount: c, collapsed: false });
      }
  };

  return (
    <div className="flex flex-col gap-3 h-full group/panel">
      <div className="relative shrink-0 filter drop-shadow-md group/header">
          <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/header:bg-primary/40" style={{ clipPath: CLIP_HEADER }} />
          <div className="relative h-14 bg-secondary/90 dark:bg-[#121214]/95 backdrop-blur-xl flex items-stretch justify-between overflow-hidden" style={{ clipPath: CLIP_HEADER, margin: '1px' }}>
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
                    <span className={cn("text-base md:text-lg font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2 drop-shadow-sm leading-none", zoneFontClass)}>
                       {name}
                    </span>
                </div>
             </div>

             <div className="flex items-center h-full pr-5 relative z-10">
                 <div className="hidden lg:flex items-center gap-1 mr-4 bg-black/10 dark:bg-white/5 p-1 rounded-md border border-white/5">
                    <button onClick={() => handleUpdateCols(1)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 1 ? "text-primary bg-white/10" : "text-muted-foreground")}><RectangleHorizontal size={14} /></button>
                    <button onClick={() => handleUpdateCols(2)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 2 ? "text-primary bg-white/10" : "text-muted-foreground")}><Columns size={14} /></button>
                    <button onClick={() => handleUpdateCols(3)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 3 ? "text-primary bg-white/10" : "text-muted-foreground")}><LayoutGrid size={14} /></button>
                 </div>
                 <div className="h-full w-8 relative flex items-center justify-center opacity-20"><div className="h-8 w-px bg-foreground rotate-12" /></div>
                 <div className="flex flex-col items-end justify-center mr-3">
                     <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">MODULES</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-foreground tracking-tight leading-none">{realItems.length.toString().padStart(2, '0')}</span>
                        <div className={cn("h-1.5 w-1.5 rounded-none transition-colors duration-500", realItems.length > 0 ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-muted")} />
                     </div>
                 </div>
                 <div className="h-9 w-9 bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover/header:text-primary group-hover/header:bg-primary/10 transition-all relative" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                    <Cpu size={16} strokeWidth={2} />
                 </div>
             </div>
             <div className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-[6px] pointer-events-none opacity-30" style={{ backgroundImage: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)` }} />
          </div>
      </div>

      <div className="relative flex-1 filter drop-shadow-lg">
          <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_BODY }} />
          <div className="relative h-full bg-background/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl p-[1px] overflow-hidden" style={{ clipPath: CLIP_BODY, margin: '1px' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover/panel:bg-primary/60 transition-colors shadow-[0_0_15px_var(--primary)] z-20 opacity-80" />
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

              <div className="p-4 md:p-5 relative z-10 h-full">
                <div ref={containerRef} className={cn("grid relative min-h-[50px]", gridClass)}>
                    <AnimatePresence mode="popLayout">
                    {fullDisplayList.map((item, index) => {
                        const position = getGridPosition(index, totalGridItems, cols);
                        const isLast = index === totalGridItems - 1;
                        const handleClick = () => {
                            if (item.type === 'single' && item.segment.segType === 'Empty') handleSpacerReplace(item.id);
                            else if (item.type === 'ghost') handleGhostClick(item.index);
                        };

                        return (
                        <DraggableDisplayItem 
                            key={item.id} item={item} index={index} position={position} isLast={isLast} segmentId={item.id}
                            containerRef={containerRef} moveItem={moveItem} onRemove={onRemove} onToggle={onToggle}
                            onPWMChange={onPWMChange} onDragStart={onDragStart} onDragEnd={onDragEnd}
                            lastReorderTime={lastReorderTime} onClick={handleClick}
                        />
                        );
                    })}
                    </AnimatePresence>
                </div>
              </div>
              
              {/* Right Side Notch Accent */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-50 group-hover/panel:opacity-100 transition-opacity">
                  <div className="w-4 h-12 border-l border-primary/20" />
                  <ChevronLeft size={12} className="text-primary absolute right-[1px]" />
              </div>

              <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none opacity-40" style={{ backgroundImage: `linear-gradient(135deg, transparent 60%, ${accentColor} 60%)` }} />
              <div className="absolute bottom-1 right-1 p-1 opacity-80 pointer-events-none text-primary/80"><CornerRightDown size={12} /></div>
          </div>
      </div>
    </div>
  );
});
