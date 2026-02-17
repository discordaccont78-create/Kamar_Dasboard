
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Terminal } from 'lucide-react';
import { CoreEmblem } from '../Effects/CoreEmblem';
import { cn } from '../../lib/utils';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;
const MotionH2 = motion.h2 as any;
const MotionP = motion.p as any;

interface EmptyDashboardStateProps {
    onOpenMenu: () => void;
    t: any; // Translations
}

export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onOpenMenu, t }) => {
  
  // Staggered Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 100, damping: 10 }
    }
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center py-12 md:py-16 min-h-[60vh]"
    >
      <div className="relative z-20 flex flex-col items-center gap-8 md:gap-10">
        
        {/* The Core Effect */}
        <div onClick={onOpenMenu} className="cursor-core transition-transform duration-500 hover:scale-105 active:scale-95">
            <CoreEmblem />
        </div>

        {/* Animated Text Container */}
        <MotionDiv 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-xs md:max-w-3xl px-4 md:px-8 flex flex-col items-center"
        >
          {/* Main Headline with Neon Glow */}
          <MotionH2 
            variants={itemVariants}
            className="text-xl md:text-4xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground drop-shadow-2xl relative"
          >
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
              THE MOST ELECTRIFYING
            </span>
            <br />
            <span 
                className="text-lg md:text-3xl tracking-[0.4em] md:tracking-[0.5em] text-primary mt-2 block animate-pulse"
                style={{ textShadow: "0 0 20px rgba(var(--primary), 0.6)" }}
            >
              IOT EXPERIENCE
            </span>
          </MotionH2>

          {/* Tech Divider */}
          <MotionDiv 
            variants={itemVariants}
            className="flex items-center justify-center gap-2 w-full my-6 opacity-60"
          >
             <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-primary" />
             <div className="h-1.5 w-1.5 rotate-45 bg-primary shadow-[0_0_10px_var(--primary)]" />
             <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-primary" />
          </MotionDiv>

          {/* Quote Block - Styled like a System Log/Terminal */}
          <MotionDiv 
            variants={itemVariants}
            className="relative group cursor-default"
          >
            <div className="absolute -inset-2 bg-primary/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative bg-black/20 dark:bg-white/5 border-l-2 border-primary pl-4 pr-6 py-3 rounded-r-xl backdrop-blur-sm shadow-sm overflow-hidden">
                {/* Scanline overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
                
                <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2 mb-1 opacity-50">
                        <Terminal size={10} className="text-primary" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-primary">System_Message_Log</span>
                    </div>
                    
                    <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed uppercase tracking-[0.05em]">
                        <span className="text-primary/60 opacity-50 mr-2 animate-pulse">[</span>
                        "{t.success_msg}
                        <br/>
                        <span className="pl-4 inline-block text-foreground font-bold drop-shadow-sm decoration-primary/50 underline underline-offset-4 decoration-2">
                            {t.focus_effort}
                        </span> 
                        <span className="text-muted-foreground"> {t.we_control}</span>"
                        <span className="text-primary/60 opacity-50 ml-2 animate-pulse">]</span>
                    </p>
                </div>
            </div>
          </MotionDiv>

          {/* Action Button */}
          <MotionDiv variants={itemVariants} className="mt-8 md:mt-10">
            <button 
                onClick={onOpenMenu}
                className="group relative bg-transparent px-8 py-4 md:px-12 md:py-5 overflow-hidden"
            >
                {/* Button Tech Borders */}
                <div className="absolute inset-0 border border-primary/30 skew-x-[-10deg] group-hover:border-primary/80 group-hover:bg-primary/5 transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary/20 group-hover:bg-primary/60 transition-colors" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
                <div className="absolute top-0 left-0 w-3 h-3 bg-primary/20 group-hover:bg-primary/60 transition-colors" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                
                <span className="relative flex items-center gap-3 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs text-foreground group-hover:text-primary transition-colors">
                    <Zap size={14} className="fill-current group-hover:scale-110 transition-transform duration-300" /> 
                    {t.init_deploy}
                </span>
            </button>
          </MotionDiv>

        </MotionDiv>
      </div>
    </MotionDiv>
  );
};
