
import React, { useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { SegmentGroup } from './SegmentGroup';
import { Segment, CMD } from '../../types/index';
import { cn } from '../../lib/utils';
import { useSegments } from '../../lib/store/segments';
import { useWebSocket } from '../../hooks/useWebSocket';

const MotionDiv = motion.div as any;

export const DraggableGroupItem = React.memo(({
  groupName,
  groupNodes,
  index,
  containerRef,
  moveGroup,
  removeSegment,
  removeGroup, 
  toggleSegment,
  setPWM,
  lastReorderTime,
  className,
  onDragStart,
  onDragEnd,
  onSegmentDragStart,
  onSegmentDragEnd
}: {
  groupName: string,
  groupNodes: Segment[],
  index: number,
  containerRef: React.RefObject<HTMLDivElement>,
  moveGroup: (from: number, to: number) => void,
  removeSegment: (id: string) => void,
  removeGroup: (name: string) => void, 
  toggleSegment: (id: string) => void,
  setPWM: any,
  lastReorderTime: React.MutableRefObject<number>,
  className: string,
  onDragStart: () => void,
  onDragEnd: () => void,
  onSegmentDragStart?: () => void,
  onSegmentDragEnd?: () => void
}) => {
  const controls = useDragControls();
  const { sendCommand } = useWebSocket();

  const handleDrag = (event: any, info: any) => {
    if (!containerRef.current) return;
    
    const now = Date.now();
    if (now - lastReorderTime.current < 400) return;

    const dragX = info.point.x;
    const dragY = info.point.y;
    
    const items = Array.from(containerRef.current.querySelectorAll('.group_area')) as HTMLElement[];
    
    let targetIndex = -1;

    items.forEach((item, idx) => {
      if (idx === index) return; 

      const rect = item.getBoundingClientRect();
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
      moveGroup(index, targetIndex);
      lastReorderTime.current = Date.now();
    }
  };

  const handleToggle = useCallback((id: string) => {
    const seg = groupNodes.find(s => s.num_of_node === id);
    if (!seg) return;

    if (seg.regBitIndex !== undefined) {
        toggleSegment(id);
        const allRegisterSegments = groupNodes.filter(s => s.gpio === seg.gpio && s.regBitIndex !== undefined);
        let newByteValue = 0;
        allRegisterSegments.forEach(s => {
            let isOn = s.is_led_on === 'on';
            if (s.num_of_node === id) {
                 isOn = !isOn; 
            }
            if (isOn) {
                newByteValue |= (1 << (s.regBitIndex || 0));
            }
        });
        sendCommand(CMD.SR_STATE, seg.gpio || 0, newByteValue);
    } else {
        toggleSegment(id);
        sendCommand(seg.is_led_on === 'on' ? CMD.LED_OFF : CMD.LED_ON, seg.gpio || 0, 0);
    }
  }, [toggleSegment, groupNodes, sendCommand]);

  const handleInternalReorder = useCallback((newNodes: Segment[]) => {
    useSegments.getState().setSegments([
        ...useSegments.getState().segments.filter(s => (s.groupId || "basic") !== groupName),
        ...newNodes
    ]);
  }, [groupName]);

  // Animation Variants for "Group" Logic
  const groupVariants = {
    idle: { scale: 1, opacity: 1, y: 0, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" },
    // On Pick Up: Lift up, shadow deepens
    dragging: { 
        scale: 1.02, 
        zIndex: 100, 
        opacity: 0.95,
        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.4))", // Use filter for shadow with clip-path
        cursor: "grabbing"
    },
    // On Delete: Shrink and Fade into void
    exit: { 
        scale: 0.8, 
        opacity: 0, 
        filter: "blur(10px)",
        transition: { duration: 0.3, ease: "backIn" } 
    }
  };

  return (
    <MotionDiv
      layout="position"
      drag
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={0.1}
      
      variants={groupVariants}
      initial="idle"
      animate="idle"
      exit="exit"
      whileDrag="dragging"
      // Mechanical Snap Physics
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        layout: { duration: 0.3, ease: "easeInOut" } 
      }}

      onDragStart={onDragStart}
      onDrag={handleDrag}
      onDragEnd={(event: any, info: any) => {
        onDragEnd(); 
        const thresholdY = window.innerHeight - 110;
        if (info.point.y > thresholdY) {
          removeGroup(groupName);
        }
      }}
      className={cn("group_area z-0 hover:z-10 relative h-full", className)}
    >
      <SegmentGroup 
        name={groupName}
        segments={groupNodes}
        dragHandle={
          <div 
             className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-all duration-300"
             onPointerDown={(e) => controls.start(e)}
             style={{ touchAction: 'none' }}
             title="Drag to Reorder"
          >
             <div className="flex flex-col gap-0.5">
                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                <div className="w-1 h-1 rounded-full bg-current opacity-80" />
                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                <div className="w-1 h-1 rounded-full bg-current opacity-40" />
             </div>
          </div>
        }
        onReorder={handleInternalReorder}
        onRemove={removeSegment}
        onToggle={handleToggle}
        onPWMChange={setPWM}
        onToggleBit={() => {}} 
        onDragStart={onSegmentDragStart}
        onDragEnd={onSegmentDragEnd}
      />
    </MotionDiv>
  );
});
