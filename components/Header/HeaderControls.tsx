
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';

// Workaround for Framer Motion types
const MotionButton = motion.button as any;
const MotionDiv = motion.div as any;

interface ControlButtonProps {
    onClick: () => void;
    icon?: React.ElementType;
    label?: string;
    title?: string;
    active?: boolean;
    variant?: 'default' | 'primary';
    className?: string;
}

// Tech Shape Calculation:
// 1. Top-Left: Large Cut (10px) -> "10px 0" start
// 2. Top-Right: Smooth/Micro Bevel (4px) -> "calc(100% - 4px) 0", "100% 4px"
// 3. Bottom-Right: Large Cut (10px) -> "100% calc(100% - 10px)", "calc(100% - 10px) 100%"
// 4. Bottom-Left: Smooth/Micro Bevel (4px) -> "4px 100%", "0 calc(100% - 4px)"
// 5. Close loop -> "0 10px"
const TECH_SHAPE = "polygon(10px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 4px 100%, 0 calc(100% - 4px), 0 10px)";

export const ControlButton: React.FC<ControlButtonProps> = ({ 
    onClick, 
    icon: Icon, 
    label, 
    title, 
    active, 
    variant = 'default', 
    className 
}) => {
    const { settings } = useSettingsStore();
    const shouldAnimate = settings.animations;

    // Define Icon Animation Variants based on global settings
    const iconVariants = {
        idle: { rotate: 0, scale: 1, y: 0 },
        hover: {
            // Primary (Settings): Mechanical Rotation
            // Default: Tech Twitch / Scale Up
            rotate: !shouldAnimate ? 0 : (variant === 'primary' ? 90 : [0, -10, 10, 0]),
            scale: !shouldAnimate ? 1 : 1.15,
            y: !shouldAnimate ? 0 : (variant === 'default' ? -1 : 0),
            transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 15 
            }
        },
        tap: { 
            scale: !shouldAnimate ? 1 : 0.9, 
            rotate: !shouldAnimate ? 0 : (variant === 'primary' ? -45 : 0) 
        }
    };

    return (
        <MotionButton
            whileHover={shouldAnimate ? "hover" : undefined}
            whileTap={shouldAnimate ? "tap" : undefined}
            onClick={onClick}
            title={title}
            initial="idle"
            className={cn(
                "relative h-10 w-10 md:h-11 md:w-11 flex items-center justify-center group shrink-0 outline-none p-0 bg-transparent",
                className
            )}
        >
            {/* LAYER 1: BORDER / OUTER SHELL */}
            <div 
                className={cn(
                    "absolute inset-0 transition-all duration-300",
                    // Primary Variant
                    variant === 'primary' 
                        ? "bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]" 
                        : "bg-border/40 group-hover:bg-primary/60",
                    
                    // Active State for Default
                    active && variant !== 'primary' ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]" : ""
                )}
                style={{ clipPath: TECH_SHAPE }}
            />

            {/* LAYER 2: INNER CONTENT CONTAINER (Inset by 1px) */}
            <div 
                className={cn(
                    "absolute inset-[1px] flex items-center justify-center transition-all duration-300 overflow-hidden",
                    // Background Logic
                    variant === 'primary' 
                        ? "bg-primary text-black" 
                        : "bg-secondary/10 dark:bg-[#0c0c0e]/80 backdrop-blur-md text-muted-foreground group-hover:text-primary",
                    
                    // Active State Background
                    active && variant !== 'primary' ? "bg-primary/10 text-primary" : ""
                )}
                style={{ clipPath: TECH_SHAPE }}
            >
                {/* Tech Grid Background (Subtle) */}
                {variant === 'default' && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] bg-[length:3px_3px]" />
                )}

                <div className="relative z-10">
                    {Icon ? (
                        <MotionDiv variants={iconVariants}>
                            <Icon 
                                className={cn(
                                    "w-[18px] h-[18px] md:w-5 md:h-5",
                                    variant === 'primary' ? 'stroke-[2.5px]' : 'stroke-2'
                                )} 
                            />
                        </MotionDiv>
                    ) : (
                        <MotionDiv variants={iconVariants}>
                            <span className="font-black text-[10px] md:text-xs tracking-wider">{label}</span>
                        </MotionDiv>
                    )}
                </div>
            </div>

            {/* LAYER 3: CORNER ACCENTS - Matches Main Cuts (Top-Left & Bottom-Right) */}
            <div className={cn(
                "absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 transition-all duration-300 pointer-events-none",
                variant === 'primary' ? "border-black/20" : "border-primary/0 group-hover:border-primary/50",
                active && variant !== 'primary' ? "border-primary/50" : ""
            )} />
            
            <div className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 transition-all duration-300 pointer-events-none",
                variant === 'primary' ? "border-black/20" : "border-primary/0 group-hover:border-primary/50",
                active && variant !== 'primary' ? "border-primary/50" : ""
            )} />

        </MotionButton>
    )
}
