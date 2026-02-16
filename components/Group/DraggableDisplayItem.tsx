
import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Segment } from '../../types/index';
import { SegmentCard } from '../Segment/SegmentCard';
import { CustomSegment } from '../Segment/CustomSegment';
import { WeatherSegment } from '../Segment/WeatherSegment';
import { InputSegment } from '../Segment/InputSegment';
import { DisplaySegment } from '../Segment/DisplaySegment';
import { RegisterSubGroup } from './RegisterSubGroup';

const MotionDiv = motion.div as any;

export type ItemPosition = 
  | 'solo' 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'middle-left' | 'middle-center' | 'middle-right' | 'middle'
  | 'bottom-left' | 'bottom-center' | 'bottom-right' 
  | 'bottom-solo';

export type DisplayItem = 
  | { type: 'single'; id: string; segment: Segment }
  | { type: 'register_group'; id: string; segments: Segment[] }
  | { type: 'ghost'; id: string; index: number }; 

interface DraggableDisplayItemProps {
  item: DisplayItem;
  index: number;
  position: ItemPosition;
  isLast: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  moveItem: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onPWMChange: (id: string, val: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  lastReorderTime: React.MutableRefObject<number>;
  className?: string;
  segmentId: string;
  onClick?: () => void;
}

export const DraggableDisplayItem = React.memo(({ 
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
  onClick 
}: DraggableDisplayItemProps) => {
  const controls = useDragControls();

  const handleDrag = (event: any, info: any) => {
    if (!containerRef.current) return;
    
    // THROTTLE: Only allow 1 swap check every 400ms to prevent crash
    const now = Date.now();
    if (now - lastReorderTime.current < 400) return;

    const dragX = info.point.x;
    const dragY = info.point.y;
    
    const items = Array.from(containerRef.current.querySelectorAll('.segment_area')) as HTMLElement[];
    
    let targetIndex = -1;

    items.forEach((element, idx) => {
      if (idx === index) return; 

      const rect = element.getBoundingClientRect();
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
      lastReorderTime.current = Date.now(); 
    }
  };

  const dragHandleProps = {
    className: "cursor-grab active:cursor-grabbing p-2 hover:bg-primary/10 rounded-none transition-colors text-muted-foreground hover:text-primary border-r border-border/50 h-full flex items-center justify-center",
    onPointerDown: (e: any) => controls.start(e),
    style: { touchAction: 'none' } as React.CSSProperties
  };

  const DragIcon = <GripVertical size={14} />;

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
  } else if (item.type === 'ghost') {
      content = (
        <SegmentCard 
            gpio={0} 
            label="EMPTY SLOT"
            position={position}
            isLast={isLast}
            segmentId={item.id}
            dragHandle={<div {...dragHandleProps}>{DragIcon}</div>} 
            variant="ghost"
            onClick={onClick}
        />
      );
  } else if (item.type === 'single') {
      const seg = item.segment;
      const isSpacer = seg.segType === 'Empty';

      if (isSpacer) {
          content = (
            <SegmentCard 
                gpio={0} 
                label="EMPTY SLOT"
                position={position}
                isLast={isLast}
                segmentId={seg.num_of_node}
                dragHandle={<div {...dragHandleProps}>{DragIcon}</div>}
                variant="spacer"
                onRemove={() => onRemove(seg.num_of_node)}
                onClick={onClick} 
            />
          );
      } else {
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
     } else if (item.type === 'register_group') {
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
      className={cn("segment_area relative h-full", className)}
      style={{ touchAction: 'none' }}
    >
      {content}
    </MotionDiv>
  );
});
