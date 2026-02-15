
import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, X, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyGroupSlotProps {
    id: string;
    onRemove: (id: string) => void;
    dragHandle?: React.ReactNode;
    onClick?: () => void;
}

const MotionDiv = motion.div as any;

const CLIP_SHAPE = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";

export const EmptyGroupSlot: React.FC<EmptyGroupSlotProps> = ({ id, onRemove, dragHandle, onClick }) => {
    return (
        <div className="h-full min-h-[180px] relative group" onClick={onClick}>
            {/* Visual Border */}
            <div 
                className="absolute inset-0 bg-transparent border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300"
                style={{ clipPath: CLIP_SHAPE }}
            />

            {/* Remove Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                className="absolute top-2 right-2 p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors z-20 opacity-0 group-hover:opacity-100"
                title="Remove Empty Group"
            >
                <X size={16} />
            </button>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground/30 group-hover:text-primary/70 transition-colors pointer-events-none">
                <div className="relative">
                    <Layers size={40} strokeWidth={1} className="group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -bottom-2 -right-2 bg-background p-0.5 rounded-full">
                        <Plus size={16} strokeWidth={3} className="text-current" />
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.2em]">EMPTY GROUP</span>
                    <span className="text-[9px] font-mono opacity-60">ID: {id.slice(-6)}</span>
                </div>
            </div>

            {/* Drag Handle Overlay - Always accessible */}
            {dragHandle && (
                <div className="absolute top-0 left-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-background/50 backdrop-blur-sm rounded-r-lg border border-border/50 text-muted-foreground">
                        <GripVertical size={20} />
                    </div>
                </div>
            )}
        </div>
    );
};
