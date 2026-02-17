
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Send, Trash2, Clock, Hourglass, Settings2, MousePointerClick, Fingerprint, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Cable, Timer, CornerDownRight, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../../components/ui/slider';
import { Segment, CMD, Schedule } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';
import { useSegments } from '../../lib/store/segments';
import { useSchedulerStore } from '../../lib/store/scheduler';
import { useSettingsStore } from '../../lib/store/settings';
import { useSoundFx } from '../../hooks/useSoundFx';
import { cn } from '../../lib/utils';
import { PulseConfig } from './PulseConfig';

interface Props {
  segment: Segment;
  onToggle?: () => void;
  onPWMChange?: (val: number) => void;
}

// Workaround for Framer Motion type compatibility
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

// Tech Shape Definition (Chamfered Corners)
const TECH_CLIP = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

const CustomSegmentInternal: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: deviceState } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  const { updateSegment } = useSegments();
  const { schedules, addSchedule } = useSchedulerStore();
  const { settings } = useSettingsStore();
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

  // Calculate intensity ratio (0.0 to 1.0) for dynamic animations
  const intensity = Math.max(0, Math.min(1, localPwm / 255));

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

  const handleToggle = useCallback(() => {
    const cmd = isOn ? CMD.LED_OFF : CMD.LED_ON;
    playToggle(!isOn); 
    
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
    <MotionDiv initial={false} className="flex flex-col gap-4">
      
      {showToggle && (
        <div className="relative">
           {/* Info Bar / Header */}
           <div className="flex justify-between items-center mb-2 px-0.5 gap-2">
              <label 
                className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 shrink-0 bg-secondary/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={cycleMode}
                title="Switch Input Mode"
              >
                 {mode === 'toggle' ? <MousePointerClick size={10} /> : <Fingerprint size={10} />}
                 <span className="hidden xs:inline">{mode === 'toggle' ? "LATCH" : "MOMENTARY"}</span>
                 <span className="xs:hidden">{mode === 'toggle' ? "TGL" : "PSH"}</span>
              </label>

              <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                 {/* Active Schedules Badges */}
                 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end">
                    <AnimatePresence>
                        {sortedSchedules.map(sch => (
                            <MotionDiv 
                                key={sch.id} 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="flex items-center gap-1 text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 shrink-0 whitespace-nowrap"
                            >
                                {sch.type === 'countdown' ? <Hourglass size={8} className="animate-pulse" /> : <Clock size={8} />}
                                <span className="font-mono text-[7px] font-bold leading-none">
                                    {sch.type === 'countdown' ? getCountdownString(sch) : sch.time}
                                </span>
                            </MotionDiv>
                        ))}
                    </AnimatePresence>
                 </div>
                 
                 {/* Auto-Off Toggle */}
                 {mode === 'toggle' && (
                    <button 
                        onClick={() => setShowPulseConfig(!showPulseConfig)}
                        className={cn(
                            "flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all",
                            (hasPulse || showPulseConfig) 
                                ? "bg-primary/20 text-primary hover:bg-primary/30" 
                                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/20"
                        )}
                        title="Pulse / Auto-Off Timer"
                    >
                        <Timer size={10} />
                        {hasPulse && !showPulseConfig && <span className="font-mono">{safeSegment.pulseDuration}s</span>}
                    </button>
                 )}
              </div>
           </div>

           {/* Pulse Configuration Panel */}
           <PulseConfig 
                segmentId={safeSegment.num_of_node}
                pulseDuration={safeSegment.pulseDuration || 0}
                show={showPulseConfig && mode === 'toggle'}
                onClose={() => setShowPulseConfig(false)}
           />

           {/* THE NEW TECH BUTTON (Version 3: Strip Mode) */}
           <div className="relative group filter drop-shadow-sm">
                {/* Connection Lines (Industrial Decoration) */}
                <div className="absolute -top-1 left-4 w-px h-2 bg-border/50 z-0 opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="absolute -bottom-1 right-4 w-px h-2 bg-border/50 z-0 opacity-50 transition-opacity group-hover:opacity-100" />

                <button
                    onPointerDown={mode === 'momentary' ? handlePressStart : undefined}
                    onPointerUp={mode === 'momentary' ? handlePressEnd : undefined}
                    onPointerLeave={mode === 'momentary' ? handlePressEnd : undefined}
                    onClick={mode === 'toggle' ? handleToggle : undefined}
                    className="relative w-full h-14 md:h-16 outline-none block active:scale-[0.98] transition-transform duration-100 overflow-hidden"
                    style={{ clipPath: TECH_CLIP }}
                >
                    {/* Layer 1: Base Background */}
                    <div className={cn(
                        "absolute inset-0 transition-colors duration-300",
                        isOn ? "bg-primary/10" : "bg-black/10 dark:bg-white/5"
                    )} />

                    {/* Striped Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] pointer-events-none" />

                    {/* NEW: Left Status Strip */}
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out z-20",
                        isOn ? "w-1.5 bg-primary shadow-[0_0_15px_var(--primary)]" : "w-[3px] bg-primary/20"
                    )}>
                        {/* Inner flowing energy when ON and Animations Enabled */}
                        {isOn && settings.animations && (
                            <MotionDiv 
                                className="absolute left-0 right-0 h-[20%] bg-white/50 blur-[2px]"
                                animate={{ top: ["0%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                    </div>

                    {/* Layer 3: Tech Borders */}
                    <div className={cn(
                        "absolute inset-0 pointer-events-none transition-all duration-300 border-[2px]",
                        isOn ? "border-primary/30" : "border-transparent group-hover:border-white/10"
                    )} style={{ clipPath: TECH_CLIP }} />
                    
                    {/* Layer 4: Corner Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Content */}
                    <div className="relative z-20 flex items-center justify-between px-6 h-full pl-8">
                        {/* Left Side: Label & Status Text */}
                        <div className="flex flex-col items-start gap-0.5">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300",
                                isOn ? "text-primary" : "text-muted-foreground"
                            )}>
                                {isOn ? "ACTIVE" : "STANDBY"}
                            </span>
                            <span className={cn(
                                "text-sm md:text-base font-black uppercase tracking-[0.1em] transition-colors duration-300 leading-none",
                                isOn ? "text-foreground drop-shadow-sm" : "text-muted-foreground/60"
                            )}>
                                {isOn ? (safeSegment.onLabel || "ON") : (safeSegment.offLabel || "OFF")}
                            </span>
                        </div>

                        {/* Right Side: Icon & Indicator */}
                        <div className="flex items-center gap-3">
                            <Power 
                                className={cn(
                                    "w-5 h-5 md:w-6 md:h-6 transition-all duration-300", 
                                    isOn ? "text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.8)]" : "text-muted-foreground opacity-40"
                                )} 
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                </button>
           </div>
        </div>
      )}

      {showSlider && (
        <div className="relative group filter drop-shadow-sm">
            {/* Same industrial decorations as Toggle Button */}
            <div className="absolute -top-1 left-4 w-px h-2 bg-border/50 z-0 opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="absolute -bottom-1 right-4 w-px h-2 bg-border/50 z-0 opacity-50 transition-opacity group-hover:opacity-100" />

            <div 
                className="relative bg-black/10 dark:bg-white/5 p-4 flex flex-col gap-4 overflow-hidden outline-none"
                style={{ clipPath: TECH_CLIP }}
            >
                {/* NEW: Left Status Strip for Slider - DYNAMIC ANIMATION */}
                <div 
                    className={cn(
                        "absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out z-20",
                        localPwm > 0 ? "w-1.5 bg-primary" : "w-[3px] bg-primary/20"
                    )}
                    style={localPwm > 0 ? {
                        boxShadow: `0 0 ${15 * intensity}px var(--primary)`,
                        opacity: 0.3 + (intensity * 0.7) // Opacity ranges from 0.3 to 1.0 based on value
                    } : {}}
                >
                    {/* Inner flowing energy when Value > 0 and Animations Enabled */}
                    {localPwm > 0 && settings.animations && (
                        <MotionDiv 
                            className="absolute left-0 right-0 h-[20%] bg-white/80 blur-[2px]"
                            style={{ opacity: intensity }} // Visual brightness scales with value
                            animate={{ top: ["0%", "100%"] }}
                            transition={{ 
                                duration: 2 - (intensity * 1.0), // Speed up: 2s (low) -> 1s (high)
                                repeat: Infinity, 
                                ease: "linear" 
                            }}
                        />
                    )}
                </div>

                {/* Overlay Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] pointer-events-none" />
                
                {/* Tech Border */}
                <div className="absolute inset-0 pointer-events-none transition-all duration-300 border-[2px] border-transparent group-hover:border-white/10" style={{ clipPath: TECH_CLIP }} />
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Content - Added Padding Left to accommodate the strip */}
                <div className="flex justify-between items-center relative z-10 pl-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <CornerDownRight size={10} /> PWM_INTENSITY
                    </label>
                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            "w-1 h-1 rounded-full",
                            localPwm > 0 ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                        )} />
                        <span className="font-mono text-[10px] font-bold text-primary">{localPwm}</span>
                    </div>
                </div>

                <div className="relative z-10 px-1 pt-1 pb-2 pl-4">
                    <Slider
                        value={[localPwm]}
                        onValueChange={handleSliderChange}
                        onValueCommit={handleSliderCommit}
                        max={255}
                        step={1}
                        className="w-full"
                    />
                    
                    {/* Ruler / Scale */}
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-1.5">
                        <div className="w-px h-1.5 bg-muted-foreground/30" />
                        <div className="w-px h-1 bg-muted-foreground/20" />
                        <div className="w-px h-1.5 bg-muted-foreground/30" />
                        <div className="w-px h-1 bg-muted-foreground/20" />
                        <div className="w-px h-1.5 bg-muted-foreground/30" />
                    </div>
                </div>
            </div>
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
                className="h-9 text-xs rounded-none border-l-2 border-primary/30 focus:border-primary"
            />
            <Button size="sm" className="h-9 px-3 rounded-sm">
                <Send size={14} />
            </Button>
            <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setCode("")}
                className="h-9 px-3 text-muted-foreground hover:text-destructive rounded-sm"
            >
                <Trash2 size={14} />
            </Button>
            </div>
        </div>
      )}
    </MotionDiv>
  );
};

export const CustomSegment = React.memo(CustomSegmentInternal);
CustomSegment.displayName = 'CustomSegment';
