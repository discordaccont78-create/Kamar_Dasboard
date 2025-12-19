
import React from 'react';
import { Terminal, Shield, Activity } from 'lucide-react';
import { Segment } from '../../types/index';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { useDeviceState } from '../../hooks/useDevice';

interface Props {
  segment: Segment;
}

export const InputSegment: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: segment } = useDeviceState(initialSegment.num_of_node);
  const safeSegment = segment || initialSegment;
  const isActive = safeSegment.inputActive;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] text-muted-foreground font-black uppercase flex items-center gap-2 tracking-widest">
            <Terminal size={14} /> State Analyzer
        </label>
        <div className="flex gap-4">
            <span className="text-[9px] font-bold text-muted-foreground/70 uppercase">Pullup: ON</span>
            <span className="text-[9px] font-bold text-muted-foreground/70 uppercase">Logic: Toggle</span>
        </div>
      </div>

      <div className="relative group">
        <div className={cn(
            "py-10 text-center text-6xl font-black rounded-2xl border transition-all duration-500 relative z-10 overflow-hidden font-mono tracking-tighter",
            isActive 
              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_30px_-10px_rgba(218,165,32,0.4)]' 
              : 'bg-secondary/10 border-border text-muted-foreground/40'
          )}
        >
          {isActive ? '1' : '0'}
          
          {/* Active State Pattern */}
          {isActive && (
             <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          )}
        </div>

        <div className={cn(
            "absolute -top-3 -right-2 px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest z-20 shadow-sm transition-all duration-500 border",
            isActive 
                ? 'bg-primary text-primary-foreground border-primary/20' 
                : 'bg-muted text-muted-foreground border-border'
            )}
        >
          {isActive ? 'HIGH' : 'LOW'}
        </div>
      </div>

      <Card className="flex items-center gap-3 p-3 bg-secondary/5 border-border shadow-none">
        <div className={cn("p-1.5 rounded-md", isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
           {isActive ? <Activity size={14} className="animate-pulse" /> : <Shield size={14} />}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                Input Monitor
            </span>
            <span className="text-[9px] font-medium text-muted-foreground">
                {isActive ? 'Signal Detected on GPIO' : 'Awaiting Signal Trigger'}
            </span>
        </div>
      </Card>
    </div>
  );
};
