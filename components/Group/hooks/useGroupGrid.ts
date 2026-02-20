
import { useMemo } from 'react';
import { Segment, GroupConfig } from '../../../types/index';
import { DisplayItem, ItemPosition } from '../DraggableDisplayItem';

export const useGroupGrid = (
    name: string, 
    segments: Segment[], 
    groups: GroupConfig[]
) => {
    
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

    // 4. Grid Position Logic (The "Split Notch" Logic)
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
                    if (row === 0) return 'top-right-split';
                    return 'middle-right-split-top';
                }
                // Lower Item of the notch
                if (row === splitLine) {
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
        if (isFirstRow && isLastCol) return 'top-right'; 
        if (isFirstRow && isFirstCol) return 'top-left';
        if (isLastRow && isLastCol) return 'bottom-right';

        if (isFirstRow) return 'top-center';
        if (isLastRow) return 'bottom-center';
        if (isFirstCol) return 'middle-left';
        if (isLastCol) return 'middle-right'; 
        
        return 'middle-center';
    };

    const gridClass = useMemo(() => {
        if (cols === 1) return "grid-cols-1 gap-1.5";
        if (cols === 2) return "grid-cols-1 md:grid-cols-2 gap-1.5";
        if (cols === 3) return "grid-cols-1 md:grid-cols-3 gap-1.5";
        return "grid-cols-1 md:grid-cols-2 gap-1.5"; 
    }, [cols]);

    return {
        fullDisplayList,
        cols,
        totalGridItems,
        gridClass,
        getGridPosition
    };
};
