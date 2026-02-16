
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Workaround for Framer Motion types
const MotionButton = motion.button as any;

interface ControlButtonProps {
    onClick: () => void;
    icon?: React.ElementType;
    label?: string;
    title?: string;
    active?: boolean;
    variant?: 'default' | 'primary';
    className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ 
    onClick, 
    icon: Icon, 
    label, 
    title, 
    active, 
    variant = 'default', 
    className 
}) => {
    return (
        <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={onClick}
            title={title}
            className={cn(
                "relative h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden group shrink-0",
                variant === 'primary' 
                    ? "bg-primary text-black border-primary shadow-[0_4px_0_rgb(var(--foreground))]"
                    : "bg-background hover:bg-secondary border-border hover:border-primary/50 text-muted-foreground hover:text-primary shadow-sm",
                active && "bg-primary/20 border-primary text-primary",
                className
            )}
        >
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative z-10">
                {Icon ? (
                    <Icon className={cn("w-[18px] h-[18px] md:w-5 md:h-5", variant === 'primary' ? 'stroke-[2.5px]' : 'stroke-2')} />
                ) : (
                    <span className="font-black text-[10px] md:text-xs">{label}</span>
                )}
            </div>
        </MotionButton>
    )
}
