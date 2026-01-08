
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSoundFx } from '../../../hooks/useSoundFx';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

export const TechButton = ({ children, onClick, className, variant = 'primary', icon: Icon }: any) => {
    const baseClass = "relative w-full h-10 font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 rounded-lg group overflow-hidden";
    
    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-white/10",
        outline: "bg-transparent border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-sm",
        ghost: "bg-secondary/10 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
    };

    return (
        <button onClick={onClick} className={cn(baseClass, variants[variant as keyof typeof variants], className)}>
            {Icon && <Icon size={14} className={cn("transition-transform group-hover:scale-110", variant === 'primary' ? 'stroke-[3px]' : '')} />}
            <span className="z-10">{children}</span>
        </button>
    );
};

export const MenuSection = ({ id, title, icon: Icon, children, activeId, onToggle, animations }: any) => {
  const isOpen = id === activeId;
  const { playSweep } = useSoundFx();

  const handleToggle = () => {
      playSweep();
      onToggle(id);
  }
  
  return (
    <div className="space-y-1">
      <button 
        onClick={handleToggle}
        className={cn(
            "w-full flex items-center gap-3 group outline-none relative overflow-hidden transition-all duration-300 select-none",
            isOpen 
                ? "py-4 px-4 bg-primary/10 border-l-4 border-primary" 
                : "py-3 px-2 border-l-4 border-transparent hover:bg-accent/50 hover:pl-3"
        )}
      >
        <div className={cn(
          "transition-all duration-300 z-10",
          isOpen ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary/70"
        )}>
            <Icon size={isOpen ? 18 : 16} strokeWidth={isOpen ? 2.5 : 2} />
        </div>
        
        <MotionSpan 
            initial={false}
            animate={animations ? { x: isOpen ? 4 : 0 } : {}}
            className={cn(
                "text-[11px] font-black uppercase tracking-[0.2em] transition-colors z-10",
                isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80"
            )}
        >
            {title}
        </MotionSpan>

        {!isOpen && (
            <div className="h-px flex-1 bg-border/40 group-hover:bg-primary/30 transition-colors ml-2" />
        )}

        <div className={cn(
          "text-muted-foreground transition-all duration-300 ml-auto z-10",
          isOpen ? "-rotate-180 text-primary" : "rotate-0"
        )}>
             <ChevronDown size={14} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
             <div className="pb-4 pt-1 space-y-4 px-2 border-l border-border/20 ml-4">
                {children}
             </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
