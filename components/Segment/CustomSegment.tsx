import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Power, Send, Trash2, Clock, Hourglass, Settings2, MousePointerClick, Fingerprint } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
// Fix: Corrected import casing to match 'components/UI/Slider.tsx'
import { Slider } from '../UI/Slider';
import { Switch } from '../ui/switch';
import { Segment, CMD } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';
import { useSegments } from '../../lib/store/segments';
import { cn } from '../../lib/utils';

interface Props {
  segment: Segment;
  onToggle?: () => void;
  onPWMChange?: (val: number) => void;
}

const MotionDiv = motion.div as any;

const CustomSegmentInternal: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: deviceState } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  const { clearSegmentTimer, updateSegment } = useSegments();
  
  // Merge state securely
  const safeSegment = useMemo(() => ({
    ...initialSegment,
    ...(deviceState || {}),
    timerFinishAt: initialSegment.timerFinishAt
  }), [initialSegment, deviceState]);

  // Local state for immediate slider feedback without network spam
  const [localPwm, setLocalPwm] = useState(safeSegment.val_of_slide);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Sync local PWM state when external update comes in (e.g. from another user)
  useEffect(() => {
    setLocalPwm(safeSegment.val_of_slide);
  }, [safeSegment.val_of_slide]);

  const isOn = safeSegment.is_led_on === 'on';
  const mode = safeSegment.onOffMode || 'toggle';

  // --- Toggle Handler (Latch) ---
  const handleToggle = useCallback(() => {
    const cmd = isOn ? CMD.LED_OFF : CMD.LED_ON;
    controlDevice({ 
        cmd, 
        gpio: safeSegment.gpio || 0, 
        value: 0, 
        nodeId: safeSegment.num_of_node 
    });
  }, [isOn, safeSegment.gpio, safeSegment.num_of_node, controlDevice]);

  // --- Momentary Handlers (Push) ---
  const handlePressStart = useCallback(() => {
     if (mode !== 'momentary') return;
     controlDevice({ cmd: CMD.LED_ON, gpio: safeSegment.gpio || 0, value: 0, nodeId: safeSegment.num_of_node });
  }, [mode, safeSegment.gpio, safeSegment.num_of_node, controlDevice]);

  const handlePressEnd = useCallback(() => {
     if (mode !== 'momentary') return;
     controlDevice({ cmd: CMD.LED_OFF, gpio: safeSegment.gpio || 0, value: 0, nodeId: safeSegment.num_of_node });
  }, [mode, safeSegment.gpio, safeSegment.num_of_node, controlDevice]);

  const cycleMode = () => {
    const newMode = mode === 'toggle' ? 'momentary' : 'toggle';
    updateSegment(safeSegment.num_of_node, { onOffMode: newMode });
  };

  // --- PWM Handlers ---
  const handleSliderChange = (vals: number[]) => {
    setLocalPwm(vals[0]); 
  };

  const handleSliderCommit = (vals: number[]) => {
     controlDevice({ 
        cmd: CMD.LED_PWM, 
        gpio: safeSegment.gpio || 0, 
        value: vals[0], 
        nodeId: safeSegment.num_of_node 
     });
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (!safeSegment.timerFinishAt) {
      if (timeLeft !== null) setTimeLeft(null);
      return;
    }

    const now = Date.now();
    const initialRemaining = safeSegment.timerFinishAt - now;
    
    if (initialRemaining <= 0) {
        setTimeLeft(null);
        return;
    }
    
    setTimeLeft(initialRemaining);

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const remaining = safeSegment.timerFinishAt! - currentNow;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(null);
        if (mode === 'toggle') handleToggle(); 
        clearSegmentTimer(safeSegment.num_of_node);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [safeSegment.timerFinishAt, safeSegment.num_of_node, handleToggle, clearSegmentTimer, mode]); 

  // Timer Text Formatter
  const timeString = useMemo(() => {
    if (!timeLeft || timeLeft <= 0) return null;
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return { h, m, s };
  }, [timeLeft]);

  const showToggle = safeSegment.segType === 'Digital' || safeSegment.segType === 'All';
  const showSlider = safeSegment.segType === 'PWM' || safeSegment.segType === 'All';
  const showCode = safeSegment.segType === 'Code' || safeSegment.segType === 'All';
  const showTimer = safeSegment.segType !== 'Code'; 

  return (
    <MotionDiv initial={false} className="flex flex-col gap-4 md:gap-6">
      
      {/* Industrial Power Button */}
      {showToggle && (
        <div className="relative">
           {/* Header Info */}
           <div className="flex justify-between items-center mb-1.5 md:mb-2 px-1">
              <label className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                 {mode === 'toggle' ? <MousePointerClick size={10} /> : <Fingerprint size={10} />}
                 {mode === 'toggle' ? "Feshari (Toggle)" : "Push Mode"}
              </label>
              <button 
                onClick={cycleMode} 
                className="text-[8px] md:text-[9px] text-primary opacity-60 hover:opacity-100 uppercase font-bold tracking-wider hover:underline flex items-center gap-1"
                title="Change Button Mode"
              >
                <Settings2 size={10} /> Change
              </button>
           </div>

           {/* The Button */}
           <button
             onPointerDown={mode === 'momentary' ? handlePressStart : undefined}
             onPointerUp={mode === 'momentary' ? handlePressEnd : undefined}
             onPointerLeave={mode === 'momentary' ? handlePressEnd : undefined}
             onClick={mode === 'toggle' ? handleToggle : undefined}
             className={cn(
                "w-full h-12 md:h-16 rounded-lg md:rounded-xl border-2 transition-all duration-300 relative overflow-hidden group active:scale-[0.98] outline-none",
                isOn 
                  ? "border-primary bg-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.25)]" 
                  : "border-white/10 bg-black/5 dark:bg-white/5 hover:border-white/20 hover:bg-white/10"
             )}
           >
              {/* Inner Glow Mesh */}
              <div className={cn(
                 "absolute inset-0 opacity-20 transition-opacity duration-500",
                 isOn ? "bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40" : ""
              )} />
              
              <div className="flex items-center justify-center gap-3 relative z-10">
                 <Power 
                    className={cn(
                        "w-5 h-5 md:w-6 md:h-6 transition-all duration-300", 
                        isOn ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "text-muted-foreground opacity-50"
                    )} 
                 />
                 <span className={cn(
                    "text-base md:text-xl font-black uppercase tracking-[0.2em] transition-colors duration-300",
                    isOn ? "text-foreground" : "text-muted-foreground opacity-50"
                 )}>
                    {isOn ? "ACTIVE" : "OFFLINE"}
                 </span>
              </div>
              
              {/* Status Bar Indicator */}
              <div className={cn(
                 "absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out",
                 isOn ? "w-full bg-primary shadow-[0_-2px_10px_rgba(var(--primary),0.5)]" : "w-0 bg-transparent"
              )} />
           </button>
        </div>
      )}

      {/* Proportional Control (Slider) */}
      {showSlider && (
        <div className="bg-secondary/5 p-3 md:p-4 rounded-lg md:rounded-xl border border-border-light dark:border-border-dark flex flex-col gap-3 md:gap-4">
          <div className="flex justify-between items-center">
             <label className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PWM Intensity</label>
             <span className="font-mono text-[10px] md:text-xs font-bold text-primary">{localPwm}</span>
          </div>
          <Slider
            value={[localPwm]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            max={255}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Protocol Injector (Code) */}
      {showCode && (
        <div className="flex flex-col gap-2">
            <label className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-1">Protocol Injector</label>
            <div className="flex gap-2 items-center">
            <Input 
                type="text" 
                placeholder="HEX..."
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
      )}

      {/* Timer / Runtime Display */}
      {showTimer && (
        <div className={cn(
            "flex items-center justify-between px-1 transition-all duration-300",
            timeLeft !== null ? "bg-primary/10 p-1.5 md:p-2 rounded-lg border border-primary/30" : ""
        )}>
            <div className="flex items-center gap-2 text-muted-foreground">
            {timeLeft !== null ? <Hourglass size={12} className="animate-spin text-primary" /> : <Clock size={12} />}
            <span className={cn(
                "text-[8px] md:text-[9px] font-black uppercase tracking-widest",
                timeLeft !== null ? "text-primary" : ""
            )}>
                {timeLeft !== null ? "Auto-Action In" : "Runtime"}
            </span>
            </div>
            
            {timeString ? (
            <div className="flex gap-1 font-mono text-[9px] md:text-[10px] font-bold items-center">
                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[20px] text-center shadow-sm">{timeString.h}</span>
                <span className="text-primary animate-pulse">:</span>
                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[20px] text-center shadow-sm">{timeString.m}</span>
                <span className="text-primary animate-pulse">:</span>
                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded min-w-[20px] text-center shadow-sm">{timeString.s}</span>
            </div>
            ) : (
            <div className="flex gap-1 font-mono text-[9px] md:text-[10px] font-bold text-foreground/80 items-center opacity-50">
                <span>00</span><span>:</span><span>00</span><span>:</span><span>00</span>
            </div>
            )}
        </div>
      )}
    </MotionDiv>
  );
};

export const CustomSegment = React.memo(CustomSegmentInternal);