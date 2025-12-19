import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { RegisterSegment } from '../Segment/RegisterSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { Segment } from '../../types/index';
import { GroupHeader } from './GroupHeader';
import { cn } from '../../lib/utils';

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

const MotionDiv = motion.div as any;

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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (event: any, info: any, currentIndex: number) => {
    if (!containerRef.current) return;
    const dragX = info.point.x;
    const dragY = info.point.y;
    const items = Array.from(containerRef.current.querySelectorAll('.segment_area')) as HTMLElement[];
    let closestIndex = currentIndex;
    let minDistance = Infinity;

    items.forEach((item, index) => {
      if (index === currentIndex) return;
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(dragX - centerX, 2) + Math.pow(dragY - centerY, 2));
      if (distance < minDistance && distance < rect.width / 1.4) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== currentIndex) {
      const newSegments = [...segments];
      const [movedItem] = newSegments.splice(currentIndex, 1);
      newSegments.splice(closestIndex, 0, movedItem);
      onReorder(newSegments);
    }
  };

  return (
    <div className="h-full relative border-2 border-dashed border-primary/20 dark:border-primary/10 rounded-[2rem] p-8 bg-secondary/5 transition-colors">
      
      {/* Group Boundary Label - Acts as a schematic label for the zone */}
      <div className="absolute -top-3 left-8 px-3 bg-[#f4f7f9] dark:bg-[#09090b] text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors z-10">
        <span>ZONE: {name}</span>
      </div>

      <div className="-mt-2 mb-6">
         <GroupHeader name={name} count={segments.length} />
      </div>
      
      <div 
        ref={containerRef}
        className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6 relative min-h-[100px]"
      >
        <AnimatePresence mode="popLayout">
          {segments.map((seg, index) => (
            <MotionDiv 
              key={seg.num_of_node} 
              layout
              drag
              dragSnapToOrigin
              onDragStart={onDragStart}
              onDrag={(e: any, info: any) => handleDrag(e, info, index)}
              onDragEnd={(event: any, info: any) => {
                onDragEnd?.();
                const thresholdY = window.innerHeight - 110;
                if (info.point.y > thresholdY) {
                  onRemove(seg.num_of_node);
                }
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="segment_area z-0 hover:z-10"
            >
              <SegmentCard 
                gpio={seg.gpio || 0} 
                label={seg.name}
                dragHandle={
                  <GripVertical 
                    className="text-muted-foreground/50 hover:text-primary transition-colors cursor-grab active:cursor-grabbing" 
                    size={20} 
                  />
                }
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
            </MotionDiv>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};