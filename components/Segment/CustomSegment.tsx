import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Send, Settings2, Timer, Hourglass, AlertCircle, X, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Segment, CMD } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';
import { useSegments } from '../../lib/store/segments';
import { cn } from '../../lib/utils';

interface Props {
  segment: Segment;
  onToggle?: () => void;
  onPWMChange?: (val: number) => void;
}

// Workaround for Framer Motion type compatibility
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const CustomSegment: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: deviceState } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  const { setSegmentAutoOff, updateSegment, clearSegmentTimer, setSegmentTimer } = useSegments();
  
  // Merge state securely
  const segment = useMemo(() => ({
    ...initialSegment,
    ...(deviceState || {}),
    // Ensure critical config fields are taken from store if device state is partial
    onOffMode: initialSegment.onOffMode,
    autoOffDuration: initialSegment.autoOffDuration || 0,
    timerFinishAt: initialSegment.timerFinishAt
  }), [initialSegment, deviceState]);

  // Local state
  const [localPwm, setLocalPwm] = useState(segment.val_of_slide);
  const [code, setCode] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  
  // Settings Input State
  const [tempAutoOff, setTempAutoOff] = useState<string>(segment.autoOffDuration?.toString() || "0");

  // Timer Logic State
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  
  // Sync local PWM
  useEffect(() => {
    setLocalPwm(segment.val_of_slide);
  }, [segment.val_of_slide]);

  // Sync Config State when panel opens
  useEffect(() => {
    if (showConfig) {
      setTempAutoOff(segment.autoOffDuration?.toString() || "0");
    }
  }, [showConfig, segment.autoOffDuration]);

  const isOn = segment.is_led_on === 'on';
  const mode = segment.onOffMode || 'toggle';

  // --- GLOBAL TIMER TICKER ---
  useEffect(() => {
    // Only run interval if the light is ON and a timer is active
    if (isOn && segment.timerFinishAt) {
        const interval = setInterval(() => {
            const current = Date.now();
            setNow(current);
            const diff = Math.ceil((segment.timerFinishAt! - current) / 1000);
            
            if (diff <= 0) {
                // Time Expired: Turn OFF
                handleToggle(false); // Force OFF
                clearInterval(interval);
            } else {
                setRemainingTime(diff);
            }
        }, 100); // Check every 100ms for smoothness
        return () => clearInterval(interval);
    } else {
        setRemainingTime(0);
    }
  }, [isOn, segment.timerFinishAt]);


  // --- HANDLERS ---

  const handleToggle = (forceState?: boolean) => {
    if (showConfig) return; // Disable toggle while editing settings

    const targetState = forceState !== undefined ? forceState : !isOn;
    
    // Command Logic
    const cmd = targetState ? CMD.LED_ON : CMD.LED_OFF;
    
    // Optimistic Update Data
    const updateData: Partial<Segment> = { 
        is_led_on: targetState ? 'on' : 'off' 
    };

    // Auto-Off Logic (Only if turning ON, mode is toggle, and duration > 0)
    if (targetState && mode === 'toggle' && segment.autoOffDuration && segment.autoOffDuration > 0) {
        const duration = segment.autoOffDuration;
        const finishAt = Date.now() + (duration * 1000);
        updateData.timerFinishAt = finishAt; // Persist expected finish time
        setSegmentTimer(segment.num_of_node, duration); // Update store immediately
    } else {
        // If turning OFF or Normal ON, clear timer
        updateData.timerFinishAt = undefined;
        clearSegmentTimer(segment.num_of_node);
    }

    // Fire Mutation
    controlDevice({ 
        cmd, 
        gpio: segment.gpio || 0, 
        value: 0, 
        nodeId: segment.num_of_node 
    });

    // Fire Store Update (for immediate UI response)
    updateSegment(segment.num_of_node, updateData);
  };

  const handleMomentary = (pressed: boolean) => {
    if (mode !== 'momentary') return;
    const cmd = pressed ? CMD.LED_ON : CMD.LED_OFF;
    
    controlDevice({ 
        cmd, 
        gpio: segment.gpio || 0, 
        value: 0, 
        nodeId: segment.num_of_node 
    });
    
    updateSegment(segment.num_of_node, { is_led_on: pressed ? 'on' : 'off' });
  };

  const handlePWMCommit = (val: number[]) => {
    const value = val[0];
    setLocalPwm(value);
    controlDevice({ 
        cmd: CMD.LED_PWM, 
        gpio: segment.gpio || 0, 
        value, 
        nodeId: segment.num_of_node 
    });
    updateSegment(segment.num_of_node, { val_of_slide: value });
  };

  const handleCodeSend = () => {
    if (!code) return;
    // Protocol example: 0xFF command for raw code
    controlDevice({ 
        cmd: CMD.CONSOLE, 
        gpio: 0, 
        value: parseInt(code) || 0, 
        nodeId: segment.num_of_node 
    });
    setCode("");
  };

  const saveConfig = () => {
    const duration = parseInt(tempAutoOff);
    if (!isNaN(duration) && duration >= 0) {
        setSegmentAutoOff(segment.num_of_node, duration);
        setShowConfig(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderDigitalButton = () => {
    // Determine visuals based on state
    const isTimerActive = isOn && segment.timerFinishAt && segment.autoOffDuration && remainingTime > 0;
    
    // Calculate progress percentage for background fill
    let progressPercent = 0;
    if (isTimerActive && segment.timerFinishAt && segment.autoOffDuration) {
        const totalMs = segment.autoOffDuration * 1000;
        const remainingMs = segment.timerFinishAt - now;
        progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
    }

    return (
        <div className="relative w-full h-24 md:h-28">
            <MotionButton
                layout
                whileTap={{ scale: 0.95 }}
                onPointerDown={() => mode === 'momentary' && handleMomentary(true)}
                onPointerUp={() => mode === 'momentary' && handleMomentary(false)}
                onPointerLeave={() => mode === 'momentary' && handleMomentary(false)}
                onClick={() => mode === 'toggle' && handleToggle()}
                className={cn(
                    "relative w-full h-full rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group outline-none",
                    // ON State
                    isOn 
                      ? "border-primary bg-primary/10 shadow-[0_0_25px_-5px_rgba(var(--primary),0.4)]" 
                      : "border-border bg-secondary/5 hover:border-primary/30 hover:bg-secondary/10",
                    // Momentary specific
                    mode === 'momentary' && "active:border-primary active:bg-primary/20"
                )}
            >
                {/* Timer Progress Background (Auto-Off Only) */}
                {isTimerActive && (
                    <div 
                        className="absolute bottom-0 left-0 h-full bg-primary/10 transition-all duration-100 ease-linear pointer-events-none"
                        style={{ width: `${progressPercent}%`, opacity: 0.3 }}
                    />
                )}

                {/* Noise Texture */}
                <div className={cn(
                     "absolute inset-0 opacity-20 transition-opacity duration-500 pointer-events-none",
                     isOn ? "bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40" : "opacity-0"
                )} />
                
                {/* Icon & Label Container */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <Power 
                        size={32} 
                        strokeWidth={isOn ? 3 : 2}
                        className={cn(
                            "transition-all duration-300",
                            isOn ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)] scale-110" : "text-muted-foreground opacity-50 group-hover:opacity-80"
                        )} 
                    />
                    
                    <div className="flex flex-col items-center">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                            isOn ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {isOn ? (mode === 'momentary' ? 'HOLDING' : 'ACTIVE') : 'STANDBY'}
                        </span>

                        {/* Timer Countdown Display */}
                        {isTimerActive && (
                            <div className="flex items-center gap-1 mt-1 text-primary animate-pulse">
                                <Hourglass size={10} />
                                <span className="text-[9px] font-mono font-bold">
                                    {remainingTime}s
                                </span>
                            </div>
                        )}
                        
                        {/* Static Auto-Off Indicator (When Off) */}
                        {!isOn && segment.autoOffDuration! > 0 && mode === 'toggle' && (
                            <div className="flex items-center gap-1 mt-1 text-muted-foreground/60">
                                <Timer size={10} />
                                <span className="text-[9px] font-mono font-bold">
                                    {segment.autoOffDuration}s Auto-Off
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Indicator Dot */}
                <div className={cn(
                    "absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300",
                    isOn ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground/20"
                )} />
            </MotionButton>

            {/* Config Trigger (Only for Toggle Mode) */}
            {mode === 'toggle' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowConfig(true); }}
                    className="absolute bottom-2 right-2 p-1.5 text-muted-foreground/30 hover:text-primary hover:bg-primary/10 rounded-md transition-all z-20"
                    title="Configure Auto-Off"
                >
                    <Settings2 size={14} />
                </button>
            )}
        </div>
    );
  };

  // --- RENDER ---

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {showConfig ? (
          <MotionDiv 
            key="config"
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.2 }}
            className="w-full h-24 md:h-28 bg-secondary/10 rounded-2xl border border-primary/20 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Timer size={12} /> Auto-Off Timer
                </span>
                <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={14} />
                </button>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Input 
                        type="number" 
                        value={tempAutoOff} 
                        onChange={(e) => setTempAutoOff(e.target.value)}
                        className="h-9 text-center font-mono font-bold pr-8"
                        placeholder="0"
                        min="0"
                    />
                    <span className="absolute right-3 top-2.5 text-[8px] font-black text-muted-foreground">SEC</span>
                </div>
                <Button size="sm" onClick={saveConfig} className="h-9 w-9 p-0 bg-primary text-black hover:bg-primary/80">
                    <Save size={16} />
                </Button>
            </div>
            
            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-medium opacity-70">
                <AlertCircle size={10} />
                <span>Set to 0 to disable auto-off.</span>
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv 
            key="controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {(segment.segType === 'Digital' || segment.segType === 'All') && renderDigitalButton()}
            
            {(segment.segType === 'PWM' || segment.segType === 'All') && (
              <div className="space-y-3 px-1">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Intensity Control</span>
                    <span className="text-primary font-mono">{localPwm} / 255</span>
                </div>
                <Slider 
                  value={[localPwm]} 
                  max={255} 
                  step={1} 
                  onValueChange={(val) => setLocalPwm(val[0])}
                  onValueCommit={handlePWMCommit}
                />
              </div>
            )}

            {segment.segType === 'Code' && (
              <div className="flex gap-2 items-center mt-2">
                <Input 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="HEX / CMD" 
                  className="font-mono text-xs h-9"
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleCodeSend}>
                  <Send size={14} />
                </Button>
              </div>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};