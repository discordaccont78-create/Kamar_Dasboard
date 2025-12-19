
import React from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { RegisterSegment } from '../Segment/RegisterSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { Segment } from '../../types/index';

interface Props {
  segments: Segment[];
  onReorder: (newSegments: Segment[]) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onPWMChange: (id: string, val: number) => void;
  onToggleBit: (id: string, bit: number) => void;
}

export const SegmentGroup: React.FC<Props> = ({ 
  segments, 
  onReorder, 
  onRemove, 
  onToggle, 
  onPWMChange, 
  onToggleBit 
}) => {
  return (
    <Reorder.Group axis="y" values={segments} onReorder={onReorder} className="grid grid-cols-1 gap-8">
      {segments.map(seg => (
        <Reorder.Item key={seg.num_of_node} value={seg} className="list-none">
          <SegmentCard 
            gpio={seg.gpio || 0} 
            label={seg.group}
            onRemove={() => onRemove(seg.num_of_node)}
            dragHandle={<GripVertical className="text-black/30 hover:text-black cursor-grab" size={20} />}
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
  );
};
