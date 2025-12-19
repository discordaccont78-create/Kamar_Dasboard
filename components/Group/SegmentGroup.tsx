
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

  // Auto-Responsive Column Calculation
  const getColSpan = (index: number) => {
    const total = segments.length;
    if (total === 1) return "col-span-1 md:col-span-2";
    if (total % 2 !== 0 && index === total - 1) return "col-span-1 md:col-span-2";
    return "col-span-1";
  };

  // Immediate 2D-Aware Swap Logic (Grid Optimized)
  const handleDrag = (event: any, info: any, currentIndex: number) => {
    if (!containerRef.current) return;

    // Use global page point for collision detection
    const dragX = info.point.x;
    const dragY = info.point.y;

    const items = Array.from(containerRef.current.querySelectorAll('.segment_area'));
    let closestIndex = currentIndex;
    let minDistance = Infinity;

    // Find closest segment center to swap immediately
    items.forEach((item, index) => {
      if (index === currentIndex) return;
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(dragX - centerX, 2) + 
        Math.pow(dragY - centerY, 2)
      );

      // Trigger swap if within range of target's bounding area
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
    <div className="group-container mb-16 p-6 border-2 border-primary/10 dark:border-primary/5 bg-white/40 dark:bg-white/5 rounded-bevel shadow-sm transition-all duration-300 segment-group overflow-visible">
      <GroupHeader name={name} count={segments.length} />
      
      <div 
        ref={containerRef}
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 auto-rows-auto relative"
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
                // Trash Zone: Bottom Footer Activation (~110px)
                const thresholdY = window.innerHeight - 110;
                if (info.point.y > thresholdY) {
                  onRemove(seg.num_of_node);
                }
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`segment_area ${getColSpan(index)}`}
            >
              <SegmentCard 
                gpio={seg.gpio || 0} 
                label={seg.group}
                dragHandle={
                  <GripVertical 
                    className="text-black/30 group-hover:text-primary transition-colors cursor-grab active:cursor-grabbing" 
                    size={22} 
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
