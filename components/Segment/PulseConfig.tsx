
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSegments } from '../../lib/store/segments';

const MotionDiv = motion.div as any;

interface PulseConfigProps {
    segmentId: string;
    pulseDuration: number;
    show: boolean;
    onClose: () => void;
}

export const PulseConfig: React.FC<PulseConfigProps> = ({ segmentId, pulseDuration, show, onClose }) => {
    const { updateSegment } = useSegments();

    const updatePulseDuration = (val: string) => {
        const seconds = parseInt(val) || 0;
        updateSegment(segmentId, { pulseDuration: seconds });
    };

    return (
        <AnimatePresence>
            {show && (
                <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-2 bg-secondary/5 rounded-lg border border-border/50"
                >
                    <div className="p-2 flex items-center gap-2">
                            <div className="flex flex-col gap-0.5 flex-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                <Timer size={10} /> Auto-Off Timer
                            </span>
                            <span className="text-[8px] text-muted-foreground">Turn OFF automatically after X seconds</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <Input 
                                type="number"
                                min="0"
                                placeholder="0 (Disabled)"
                                className="h-7 w-20 text-center text-[10px]"
                                value={pulseDuration || ''}
                                onChange={(e) => updatePulseDuration(e.target.value)}
                            />
                            <span className="text-[9px] font-mono font-bold text-muted-foreground">SEC</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
                                <X size={12} />
                            </Button>
                            </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};
