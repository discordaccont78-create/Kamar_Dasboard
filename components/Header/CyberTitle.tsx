
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

const CYBER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*<>";

interface CyberTitleProps {
    text: string;
    fontClass: string;
    discharging: boolean;
    accentColor: string;
}

export const CyberTitle: React.FC<CyberTitleProps> = ({ 
    text, 
    fontClass, 
    discharging, 
    accentColor 
}) => {
  const [scrambleText, setScrambleText] = useState(text);
  
  // displayIndex: currently visible characters
  // targetIndex: desired visible characters based on mouse position
  const [displayIndex, setDisplayIndex] = useState(text.length);
  const [targetIndex, setTargetIndex] = useState(text.length);
  
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Common Styles for both Ghost and Visible Text
  const textStyles = cn(
      "text-lg md:text-3xl font-black uppercase tracking-[0.15em] leading-none whitespace-nowrap",
      fontClass
  );

  // 1. Reset state when prop text changes
  useEffect(() => {
      setDisplayIndex(text.length);
      setTargetIndex(text.length);
      setScrambleText(text);
  }, [text]);

  // 2. Scramble Logic (Only during Lightning Discharge)
  useEffect(() => {
    if (!discharging) return;
    
    let iteration = 0;
    const interval = setInterval(() => {
      setScrambleText(prev => 
        text.split("").map((char, index) => {
            if (index < iteration) return text[index];
            return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)];
        }).join("")
      );
      iteration += 1 / 4;
      if (iteration >= text.length) clearInterval(interval);
    }, 60);

    return () => clearInterval(interval);
  }, [discharging, text]);

  // 3. Smooth Transition Loop (The Typewriter Engine)
  useEffect(() => {
      if (discharging) return; 

      if (displayIndex !== targetIndex) {
          const timeout = setTimeout(() => {
              setDisplayIndex(prev => {
                  if (prev < targetIndex) return prev + 1; // Type forward
                  if (prev > targetIndex) return prev - 1; // Delete backward
                  return prev;
              });
          }, 30); // Speed of character transition (ms)
          return () => clearTimeout(timeout);
      }
  }, [displayIndex, targetIndex, discharging]);

  // 4. Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent) => {
      if (discharging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      const fraction = Math.max(0, Math.min(1, x / rect.width));
      let newTarget = Math.floor(fraction * text.length) + 1;
      newTarget = Math.max(1, Math.min(newTarget, text.length)); // Clamp
      
      setTargetIndex(newTarget);
      setIsHovered(true);
  };

  const handleMouseLeave = () => {
      setIsHovered(false);
      setTargetIndex(text.length); // Animate back to full text
  };

  return (
    <div 
        ref={containerRef}
        className="relative group cursor-default select-none flex items-center justify-start py-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
        {/* GHOST LAYER: Occupies space to keep layout stable */}
        <div className={cn(textStyles, "opacity-0 invisible")} aria-hidden="true">
            {text}
        </div>

        {/* VISIBLE LAYER */}
        <MotionDiv
            className={cn("absolute left-0 top-1/2 -translate-y-1/2 flex items-center z-10", textStyles)}
            style={{
                color: "hsl(var(--foreground))",
                textShadow: discharging ? `0 0 10px ${accentColor}` : `0 0 1px ${accentColor}40`
            }}
            animate={discharging 
                ? { x: [-1, 1, 0], skewX: [0, 2, 0] } 
                : { x: 0, skewX: 0 } 
            }
            transition={{ duration: 0.1 }}
        >
            {discharging ? scrambleText : text.slice(0, displayIndex)}
            
            {/* Blinking Cursor */}
            {(!discharging && isHovered) && (
                <span className="text-primary animate-pulse ml-0.5 inline-block">_</span>
            )}
        </MotionDiv>
        
        {/* Glow Layer */}
        <MotionDiv
            className={cn("absolute left-0 top-1/2 -translate-y-1/2 blur-[4px] pointer-events-none", textStyles)}
            style={{ color: accentColor }}
            animate={{ 
                opacity: discharging ? 0.6 : 0.05, 
                scale: discharging ? 1.05 : 1
            }}
        >
            {discharging ? scrambleText : text.slice(0, displayIndex)}
        </MotionDiv>
    </div>
  );
};
