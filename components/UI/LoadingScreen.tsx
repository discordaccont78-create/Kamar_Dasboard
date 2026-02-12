
import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Wifi, Database, Activity } from 'lucide-react';

const MotionDiv = motion.div as any;

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] text-primary flex flex-col items-center justify-center font-mono select-none overflow-hidden">
        {/* Background Grid Animation */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
                 backgroundImage: 'linear-gradient(rgba(218, 165, 32, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(218, 165, 32, 0.1) 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
             }} 
        />
        
        <MotionDiv 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-8"
        >
            {/* Central Spinner */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                <MotionDiv 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-l-2 border-primary rounded-full shadow-[0_0_15px_rgba(218,165,32,0.5)]"
                />
                <MotionDiv 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border-r-2 border-b-2 border-primary/50 rounded-full"
                />
                <Cpu size={48} className="text-primary animate-pulse" />
            </div>

            {/* Status Text */}
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white">System Sync</h2>
                <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest mt-2">
                    <span className="flex items-center gap-1"><Wifi size={10} className="animate-pulse" /> Connecting</span>
                    <span className="flex items-center gap-1"><Database size={10} className="animate-pulse delay-75" /> Fetching Config</span>
                    <span className="flex items-center gap-1"><Activity size={10} className="animate-pulse delay-150" /> Initializing</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-gray-900 rounded-full overflow-hidden mt-4">
                <MotionDiv 
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-full bg-primary shadow-[0_0_10px_var(--primary)]"
                />
            </div>
        </MotionDiv>

        {/* Bottom branding */}
        <div className="absolute bottom-8 text-[8px] font-black uppercase tracking-[0.5em] opacity-30">
            Kamyar Pro Node Controller
        </div>
    </div>
  );
};
