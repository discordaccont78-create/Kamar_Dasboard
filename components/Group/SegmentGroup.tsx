
import React from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { RegisterSegment } from '../Segment/RegisterSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { Segment } from '../../types/index';
import { GroupHeader } from './GroupHeader';

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
}

export const SegmentGroup: React.FC<Props> = ({ 
  name,
  segments, 
  onReorder, 
  onRemove, 
  onToggle, 
  onPWMChange, 
  onToggleBit,
  onDragStart,
  onDragEnd
}) => {
  // Logic to determine if a segment should span full width based on the provided rules:
  // 1. Single segment -> 100%
  // 2. Last segment in an odd-count list -> 100%
  const getColSpan = (index: number) => {
    const total = segments.length;
    if (total === 1) return "col-span-1 md:col-span-2";
    if (total % 2 !== 0 && index === total - 1) return "col-span-1 md:col-span-2";
    return "col-span-1";
  };

  return (
    <div className="group-container mb-16 p-6 border-2 border-primary/20 bg-white/30 dark:bg-white/5 rounded-bevel shadow-sm transition-all duration-300">
      <GroupHeader name={name} count={segments.length} />
      
      <div className="mt-8">
        <Reorder.Group 
          axis="y" 
          values={segments} 
          onReorder={onReorder} 
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 auto-rows-auto"
        >
          {segments.map((seg, index) => (
            <Reorder.Item 
              key={seg.num_of_node} 
              value={seg} 
              className={`list-none ${getColSpan(index)}`}
              onDragStart={onDragStart}
              onDragEnd={(event, info) => {
                onDragEnd?.();
                // Trash zone logic: check if dropped near the bottom footer area
                const trashY = window.innerHeight - 100;
                if (info.point.y > trashY) {
                  onRemove(seg.num_of_node);
                }
              }}
            >
              <SegmentCard 
                gpio={seg.gpio || 0} 
                label={seg.group}
                dragHandle={<GripVertical className="text-black/50 hover:text-black transition-colors" size={16} />}
              >
                {seg.groupType === 'custom' && (
                  <CustomSegment 
                    segment={seg} 
                    onToggle={() => onToggle(seg.num_of_node)} 
                    onPWMChange={(val) => onPWMChange(seg.num_of_node, val)} 
                  />
                )}
                {seg.groupType === 'register' && (
                  <RegisterSegment 
                    segment={seg} 
                    onToggleBit={(bit) => onToggleBit(seg.num_of_node, bit)} 
                  />
                )}
                {seg.groupType === 'input' && <InputSegment segment={seg} />}
                {seg.groupType === 'weather' && <WeatherSegment segment={seg} />}
              </SegmentCard>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
};
