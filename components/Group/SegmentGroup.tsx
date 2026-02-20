
import React, { useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Segment } from '../../types/index';
import { cn } from '../../lib/utils';
import { useSegments } from '../../lib/store/segments'; 
import { DraggableDisplayItem } from './DraggableDisplayItem';
import { useGroupGrid } from './hooks/useGroupGrid';
import { GroupFrame } from './GroupFrame';

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
  const { groups, updateGroup, addGroup, addSegment } = useSegments(); 
  const lastReorderTime = useRef<number>(0);

  // Use the new hook for all grid logic
  const { 
      fullDisplayList, 
      cols, 
      totalGridItems, 
      gridClass, 
      getGridPosition 
  } = useGroupGrid(name, segments, groups);

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

  const handleUpdateCols = (c: 1 | 2 | 3) => {
      const existingGroup = groups.find(g => g.id === name);
      if (existingGroup) {
          updateGroup(name, { columnCount: c });
      } else {
          addGroup({ id: name, name: name, order: groups.length, columnCount: c, collapsed: false });
      }
  };

  return (
    <GroupFrame 
        name={name} 
        itemCount={segments.filter(s => s.groupType !== 'register' || s.regBitIndex === 0).length} 
        cols={cols} 
        dragHandle={dragHandle} 
        onUpdateCols={handleUpdateCols}
        containerRef={containerRef}
    >
        {/* Added w-full to ensure grid takes full width of the container */}
        <div 
            ref={containerRef} 
            className={cn("grid relative min-h-[50px] w-full", gridClass)}
        >
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
                            onClick={handleClick}
                            hasStrip={cols === 1} // Force Strip logic for 1-column layout
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    </GroupFrame>
  );
});
