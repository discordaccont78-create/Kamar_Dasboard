
import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { CoreEmblem } from '../Effects/CoreEmblem';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

interface EmptyDashboardStateProps {
    onOpenMenu: () => void;
    t: any; // Translations
}

export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({ onOpenMenu, t }) => {
  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 md:py-16 min-h-[60vh]">
      <MotionDiv onClick={onOpenMenu} className="relative z-20 cursor-pointer flex flex-col items-center gap-8 md:gap-10">
        <CoreEmblem />
        <div className="text-center max-w-xs md:max-w-2xl px-4 md:px-8 space-y-4">
          <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary drop-shadow-md">
            THE MOST ELECTRIFYING <br />
            <span className="text-foreground/80 text-lg md:text-2xl tracking-[0.4em]">IOT EXPERIENCE</span>
          </h2>
          <div className="h-0.5 w-24 md:w-40 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-60 my-4" />
          <p className="text-xs md:text-sm font-bold text-muted-foreground italic leading-relaxed uppercase tracking-[0.1em] mb-4 md:mb-6">
            "{t.success_msg} <br/>
            <span className="text-foreground not-italic border-b-2 border-primary transition-colors">{t.focus_effort}</span> {t.we_control}"
          </p>
        </div>
        <button className="bg-background text-primary border-2 border-primary/50 px-8 py-4 md:px-12 md:py-5 rounded-bevel font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] hover:shadow-[0_0_40px_-5px_rgba(var(--primary),0.8)] active:scale-95">
          <span className="flex items-center gap-3"><Zap size={16} fill="currentColor" /> {t.init_deploy}</span>
        </button>
      </MotionDiv>
    </MotionDiv>
  );
};
