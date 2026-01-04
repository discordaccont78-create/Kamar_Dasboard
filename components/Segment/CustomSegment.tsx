
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Send, Trash2, Clock, Hourglass, Settings2, MousePointerClick, Fingerprint, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Cable, Timer, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Segment, CMD, Schedule } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';
import { useSegments } from '../../lib/store/segments';
import { useSchedulerStore } from '../../lib/store/scheduler';
import { useSoundFx } from '../../hooks/useSoundFx';
import { cn } from '../../lib/utils';

interface Props {
  segment: Segment;
  onToggle?: () => void;
  onPWMChange?: (val: number) => void;
}

// Workaround for Framer Motion type compatibility
const MotionDiv = motion.div as any;

const CustomSegmentInternal: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: deviceState } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  const { updateSegment } = useSegments();
  const { schedules, addSchedule } = useSchedulerStore();
  const { playToggle, playClick } = useSoundFx();
  
  // Merge state securely
  const safeSegment = useMemo(() => ({
    ...initialSegment,
    ...(deviceState || {}),
    // FORCE overrides for config that might be stale in deviceState cache
    onOffMode: initialSegment.onOffMode,
    timerFinishAt: initialSegment.timerFinishAt,
    pulseDuration: initialSegment.pulseDuration || 0,
    onLabel: initialSegment.onLabel,
    offLabel: initialSegment.offLabel
  }), [initialSegment, deviceState]);

  // Local state
  const [localPwm, setLocalPwm] = useState(safeSegment.val_of_slide);
  const [code, setCode] = useState("");
  const [showPulseConfig, setShowPulseConfig] = useState(false);
  
  // Global "Now" state to trigger re-renders for countdowns without individual intervals
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync local PWM
  useEffect(() => {
    setLocalPwm(safeSegment.val_of_slide);
  }, [safeSegment.val_of_slide]);

  const isOn = safeSegment.is_led_on === 'on';
  const mode = safeSegment.onOffMode || 'toggle';

  // --- Identify Active Schedules for this Segment ---
  const activeSchedules = useMemo(() => 
    schedules.filter(s => s.targetSegmentId === safeSegment.num_of_node && s.enabled),
  [schedules, safeSegment.num_of_node]);

  // --- Sorting Logic ---
  const sortedSchedules = useMemo(() => {
    return [...activeSchedules].sort((a, b) => {
        const getNextExecutionTime = (s: Schedule) => {
            if (s.type === 'input') {
                return Infinity; // Inputs don't have a time, push to end
            } else if (s.type === 'countdown') {
                return (s.startedAt || 0) + (s.duration || 0) * 1000;
            } else if (s.type === 'daily') {
                if (!s.time) return Infinity;
                const parts = s.time.split(':').map(Number);
                const h = parts[0];
                const m = parts[1];
                const sec = parts[2] || 0;

                const targetDate = new Date();
                targetDate.setHours(h, m, sec, 0);
                
                if (targetDate.getTime() < Date.now()) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }
                return targetDate.getTime();
            }
            return Infinity;
        };

        return getNextExecutionTime(a) - getNextExecutionTime(b);
    });
  }, [activeSchedules, now]);

  const getCountdownString = (schedule: Schedule) => {
    if (schedule.type !== 'countdown') return null;
    const finishTime = (schedule.startedAt || 0) + (schedule.duration || 0) * 1000;
    const diff = finishTime - now;
    if (diff <= 0) return "00:00";
    
    const totalSeconds = Math.ceil(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    
    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  const getActionIndicator = (sch: Schedule) => {
    if (sch.action === 'ON') {
        return <ArrowUpCircle size={8} strokeWidth={3} className="text-green-500" />;
    }
    if (sch.action === 'OFF') {
        return <ArrowDownCircle size={8} strokeWidth={3} className="text-destructive" />;
    }
    if (sch.action === 'TOGGLE') {
        return <ArrowLeftRight size={8} strokeWidth={3} className="text-blue-500" />;
    }
    if (sch.action === 'SET_VALUE') {
        return <span className="text-[6px] text-orange-500 font-black font-mono">={sch.targetValue}</span>;
    }
    return null;
  };

  const handleToggle = useCallback(() => {
    const cmd = isOn ? CMD.LED_OFF : CMD.LED_ON;
    playToggle(!isOn); // Play sound effect based on TARGET state (if currently ON, we turn OFF, so we pass false)
    
    // Auto-Off Pulse Logic
    if (!isOn && safeSegment.pulseDuration && safeSegment.pulseDuration > 0 && mode === 'toggle') {
        addSchedule({
            id: Math.random().toString(36).substr(2, 9),
            type: 'countdown',
            duration: safeSegment.pulseDuration,
            startedAt: Date.now(),
            targetSegmentId: safeSegment.num_of_node,
            action: 'OFF',
            enabled: true,
            repeatMode: 'once'
        });
    }

    controlDevice({ 
        cmd, 
        gpio: safeSegment.gpio || 0, 
        value: 0, 
        nodeId: safeSegment.num_of_node 
    });
  }, [isOn, safeSegment, mode, controlDevice, addSchedule, playToggle]);

  const handlePressStart = useCallback(() => {
     if (mode !== 'momentary') return;
     playClick();
     controlDevice({ cmd: CMD.LED_ON, gpio: safeSegment.gpio || 0, value: 0, nodeId: safeSegment.num_of_node });
  }, [mode, safeSegment.gpio, safeSegment.num_of_node, controlDevice, playClick]);

  const handlePressEnd = useCallback(() => {
     if (mode !== 'momentary') return;
     controlDevice({ cmd: CMD.LED_OFF, gpio: safeSegment.gpio || 0, value: 0, nodeId: safeSegment.num_of_node });
  }, [mode, safeSegment.gpio, safeSegment.num_of_node, controlDevice]);

  const cycleMode = () => {
    const newMode = mode === 'toggle' ? 'momentary' : 'toggle';
    updateSegment(safeSegment.num_of_node, { onOffMode: newMode });
  };

  const updatePulseDuration = (val: string) => {
      const seconds = parseInt(val) || 0;
      updateSegment(safeSegment.num_of_node, { pulseDuration: seconds });
  };

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

  const showToggle = safeSegment.segType === 'Digital' || safeSegment.segType === 'All';
  const showSlider = safeSegment.segType === 'PWM' || safeSegment.segType === 'All';
  const showCode = safeSegment.segType === 'Code' || safeSegment.segType === 'All';
  const hasPulse = safeSegment.pulseDuration && safeSegment.pulseDuration > 0;

  return (
    <MotionDiv initial={false} className="flex flex-col gap-4 md:gap-6">
      
      {showToggle && (
        <div className="relative">
           <div className="flex justify-between items-center mb-1.5 md:mb-2 px-1 gap-2">
              <label className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1 shrink-0">
                 {mode === 'toggle' ? <MousePointerClick size={10} /> : <Fingerprint size={10} />}
                 <span className="hidden xs:inline">{mode === 'toggle' ? "Feshari (Toggle)" : "Push Mode"}</span>
                 <span className="xs:hidden">{mode === 'toggle' ? "TGL" : "PSH"}</span>
              </label>

              <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end px-1">
                    {sortedSchedules.map(sch => (
                        <div key={sch.id} className="flex items-center gap-1.5 text-primary animate-in fade-in zoom-in duration-300 bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 shrink-0 whitespace-nowrap">
                            {sch.type === 'countdown' ? (
                               <Hourglass size={8} className="animate-pulse" />
                            ) : sch.type === 'input' ? (
                               <Cable size={8} />
                            ) : (
                               <Clock size={8} />
                            )}
                            <span className="font-mono text-[8px] font-bold leading-none">
                                {sch.type === 'countdown' ? getCountdownString(sch) : sch.type === 'input' ? `GP${sch.sourceGpio}` : sch.time}
                            </span>
                            <div className="pl-1 border-l border-primary/20 flex items-center">
                                {getActionIndicator(sch)}
                            </div>
                        </div>
                    ))}
                 </div>
                 
                 {/* Auto-Off / Pulse Configuration Button */}
                 {mode === 'toggle' && (
                    <button 
                        onClick={() => setShowPulseConfig(!showPulseConfig)}
                        className={cn(
                            "text-[8px] md:text-[9px] uppercase font-bold tracking-wider hover:underline flex items-center gap-1 ml-1 shrink-0 transition-colors",
                            (hasPulse || showPulseConfig) ? "text-primary opacity-100" : "text-muted-foreground opacity-50 hover:opacity-100"
                        )}
                        title="Auto-Off Timer (Pulse)"
                    >
                        <Timer size={10} /> <span className="hidden sm:inline">Pulse</span>
                        {hasPulse && !showPulseConfig && <span className="font-mono text-[7px] bg-primary/20 px-1 rounded">{safeSegment.pulseDuration}s</span>}
                    </button>
                 )}

                 <button 
                    onClick={cycleMode} 
                    className="text-[8px] md:text-[9px] text-primary opacity-60 hover:opacity-100 uppercase font-bold tracking-wider hover:underline flex items-center gap-1 ml-1 shrink-0"
                    title="Change Button Mode"
                 >
                    <Settings2 size={10} /> <span className="hidden sm:inline">Change</span>
                 </button>
              </div>
           </div>

           {/* Pulse Configuration Popover/Area */}
           <AnimatePresence>
                {showPulseConfig && mode === 'toggle' && (
                    <MotionDiv
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-2 bg-secondary/5 rounded-lg border border-border/50"
                    >
                        <div className="p-2 flex items-center gap-2">
                             <div className="flex flex-col gap-0.5 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                    <Timer size={10} /> Auto-Off Timer
                                </span>
                                <span className="text-[8px] text-muted-foreground">Turn OFF automatically after X seconds</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Input 
                                    type="number"
                                    min="0"
                                    placeholder="0 (Disabled)"
                                    className="h-7 w-20 text-center text-[10px]"
                                    value={safeSegment.pulseDuration || ''}
                                    onChange={(e) => updatePulseDuration(e.target.value)}
                                />
                                <span className="text-[9px] font-mono font-bold text-muted-foreground">SEC</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowPulseConfig(false)}>
                                    <X size={12} />
                                </Button>
                             </div>
                        </div>
                    </MotionDiv>
                )}
           </AnimatePresence>

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
                    {isOn ? (safeSegment.onLabel || "ON") : (safeSegment.offLabel || "OFF")}
                 </span>
                 
                 {/* Small Pulse Indicator on the button itself if active and running */}
                 {isOn && hasPulse && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
                         <Timer size={10} className="animate-pulse text-primary" />
                         <span className="text-[8px] font-mono font-bold text-primary">AUTO-OFF</span>
                    </div>
                 )}
              </div>
              
              <div className={cn(
                 "absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out",
                 isOn ? "w-full bg-primary shadow-[0_-2px_10px_rgba(var(--primary),0.5)]" : "w-0 bg-transparent"
              )} />
           </button>
        </div>
      )}

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
    </MotionDiv>
  );
};
const CustomSegment = React.memo(CustomSegmentInternal);
CustomSegment.displayName = 'CustomSegment';
export { CustomSegment };
