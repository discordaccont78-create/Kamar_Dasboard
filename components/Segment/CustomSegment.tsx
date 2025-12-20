
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, Send, Trash2, Clock, Hourglass } from 'lucide-react';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Segment, CMD } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';
import { useSegments } from '../../lib/store/segments';
import { cn } from '../../lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 duration-100" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

interface Props {
  segment: Segment;
  onToggle?: () => void;
  onPWMChange?: (val: number) => void;
}

const MotionDiv = motion.div as any;

export const CustomSegment: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: deviceState } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  const { clearSegmentTimer } = useSegments();
  
  // MERGE LOGIC:
  // 1. initialSegment: Contains Client-Side Data (Timer, Name, Group) from Zustand Store.
  // 2. deviceState: Contains Live Hardware Data (LED Status, PWM) from React Query/WebSocket.
  // We prioritize deviceState for HW values, but FORCE timerFinishAt from initialSegment.
  const safeSegment = {
    ...initialSegment,
    ...(deviceState || {}),
    timerFinishAt: initialSegment.timerFinishAt // Explicitly use prop from store
  };

  const isOn = safeSegment.is_led_on === 'on';
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Timer Logic
  useEffect(() => {
    if (!safeSegment.timerFinishAt) {
      setTimeLeft(null);
      return;
    }

    const checkTimer = () => {
      const remaining = Math.ceil((safeSegment.timerFinishAt! - Date.now()) / 1000);
      
      if (remaining <= 0) {
        setTimeLeft(0);
        handleToggle(); // Toggle the device
        clearSegmentTimer(safeSegment.num_of_node); // Remove timer from store
      } else {
        setTimeLeft(safeSegment.timerFinishAt! - Date.now());
      }
    };

    // Initial check
    checkTimer();

    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [safeSegment.timerFinishAt, safeSegment.num_of_node]); // Removed dependencies that might cause loops

  // Format Time Helper
  const formatTime = (ms: number) => {
    if (ms <= 0) return { h: '00', m: '00', s: '00' };
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return { h, m, s };
  };

  const handleToggle = () => {
    const cmd = isOn ? CMD.LED_OFF : CMD.LED_ON;
    controlDevice({ 
        cmd, 
        gpio: safeSegment.gpio || 0, 
        value: 0, 
        nodeId: safeSegment.num_of_node 
    });
  };

  const handlePWM = (val: number) => {
     controlDevice({ 
        cmd: CMD.LED_PWM, 
        gpio: safeSegment.gpio || 0, 
        value: val, 
        nodeId: safeSegment.num_of_node 
     });
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6"
    >
      {/* Power Control */}
      {(safeSegment.segType === 'All' || safeSegment.segType === 'Digital') && (
        <div className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/10 shadow-sm transition-all hover:shadow-md">
           <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Relay Logic</label>
              <span className="text-xs font-mono font-bold transition-colors text-foreground/50">
                {isOn ? <span className="text-primary">ACTIVE</span> : 'IDLE'}
              </span>
           </div>
           <Switch checked={isOn} onCheckedChange={handleToggle} />
        </div>
      )}

      {/* Proportional Control */}
      {(safeSegment.segType === 'All' || safeSegment.segType === 'PWM') && (
        <div className="bg-secondary/5 p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PWM Intensity</label>
             <span className="font-mono text-xs font-bold text-primary">{safeSegment.val_of_slide}</span>
          </div>
          <Slider
            value={[safeSegment.val_of_slide]}
            onValueChange={(vals) => handlePWM(vals[0])}
            max={255}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Code Injection */}
      <div className="flex flex-col gap-2">
        <label className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-1">Protocol Injector</label>
        <div className="flex gap-2 items-center">
          <Input 
            type="text" 
            placeholder="Command Hex..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-9 text-xs"
          />
          <Button size="sm" className="h-9 px-3">
            <Send size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setCode("")}
            className="h-9 px-3 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Runtime / Timer Section */}
      <div className={cn(
        "flex items-center justify-between px-1 transition-all duration-300",
        timeLeft !== null ? "bg-primary/10 p-2 rounded-lg border border-primary/30" : ""
      )}>
        <div className="flex items-center gap-2 text-muted-foreground">
           {timeLeft !== null ? <Hourglass size={12} className="animate-spin text-primary" /> : <Clock size={12} />}
           <span className={cn(
             "text-[9px] font-black uppercase tracking-widest",
             timeLeft !== null ? "text-primary" : ""
           )}>
             {timeLeft !== null ? "Auto-Toggle In" : "Runtime"}
           </span>
        </div>
        
        {timeLeft !== null ? (
          // Active Timer Display
          <div className="flex gap-1 font-mono text-[10px] font-bold items-center">
            <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[22px] text-center shadow-sm">{formatTime(timeLeft).h}</span>
            <span className="text-primary animate-pulse">:</span>
            <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[22px] text-center shadow-sm">{formatTime(timeLeft).m}</span>
            <span className="text-primary animate-pulse">:</span>
            <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[22px] text-center shadow-sm">{formatTime(timeLeft).s}</span>
          </div>
        ) : (
          // Default Static Display
          <div className="flex gap-1 font-mono text-[10px] font-bold text-foreground/80 items-center">
            <span className="bg-secondary/10 px-1.5 py-0.5 rounded min-w-[22px] text-center">00</span>
            <span className="text-muted-foreground/40">:</span>
            <span className="bg-secondary/10 px-1.5 py-0.5 rounded min-w-[22px] text-center">00</span>
            <span className="text-muted-foreground/40">:</span>
            <span className="bg-secondary/10 px-1.5 py-0.5 rounded min-w-[22px] text-center">00</span>
          </div>
        )}
      </div>
    </MotionDiv>
  );
};
