
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Timer, Cable, CloudFog, Thermometer, Droplets, Repeat, Infinity, Check, Hash, Power, ToggleLeft } from 'lucide-react';
import { useSegments } from '../../lib/store/segments';
import { useSchedulerStore } from '../../lib/store/scheduler';
import { useSettingsStore } from '../../lib/store/settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../../components/ui/slider';
import { translations } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { ButtonTrigger } from '../../types/index';

const MotionDiv = motion.div as any;

const TRIGGER_OPTIONS: { value: ButtonTrigger; label: string }[] = [
  { value: 2, label: "HIGH (1)" },
  { value: 3, label: "LOW (0)" },
  { value: 1, label: "TOGGLE" },
  { value: 0, label: "HOLD" }
];

export const SchedulerBuilder: React.FC = () => {
  const { segments } = useSegments();
  const { schedules, addSchedule } = useSchedulerStore();
  const { settings } = useSettingsStore();
  const t = translations[settings.language];

  // Condition Type State
  const [conditionType, setConditionType] = useState<'daily' | 'countdown' | 'input' | 'weather'>('daily');

  // Time Inputs
  const [time, setTime] = useState("");
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [timerSeconds, setTimerSeconds] = useState(0); 
  
  // Input Condition Inputs
  const [sourceGpio, setSourceGpio] = useState("");
  const [inputTrigger, setInputTrigger] = useState<ButtonTrigger>(2); // Default to High (2)

  // Weather Condition Inputs
  const [weatherSourceId, setWeatherSourceId] = useState("");
  const [weatherMetric, setWeatherMetric] = useState<'temp' | 'hum'>('temp');
  const [weatherOperator, setWeatherOperator] = useState<'>' | '<' | '='>('>');
  const [weatherValue, setWeatherValue] = useState(25);

  // New: Repetition State
  const [repeatMode, setRepeatMode] = useState<'daily' | 'once' | 'count'>('daily');
  const [repeatCount, setRepeatCount] = useState(1);

  // Target & Action State
  const [targetId, setTargetId] = useState("");
  const [action, setAction] = useState<'ON' | 'OFF' | 'TOGGLE' | 'SET_VALUE'>('ON');
  const [pwmValue, setPwmValue] = useState(128); 
  
  // New State for 'All' type segments: 'digital' or 'pwm'
  const [hybridMode, setHybridMode] = useState<'digital' | 'pwm'>('digital');

  // Filter for allowed segments (Targets)
  const allowedSegments = segments.filter(s => 
    s.segType === 'Digital' || s.segType === 'All' || s.groupType === 'register' || s.segType === 'PWM'
  );

  // Filter for Weather segments (Source)
  const weatherSegments = segments.filter(s => s.groupType === 'weather');

  const selectedSegment = segments.find(s => s.num_of_node === targetId);
  const isHybrid = selectedSegment?.segType === 'All';
  const isPurePwm = selectedSegment?.segType === 'PWM';
  const showPwmTools = isPurePwm || (isHybrid && hybridMode === 'pwm');

  // --- Input Trigger Validation Logic ---
  const takenTriggers = useMemo(() => {
    if (conditionType !== 'input' || !sourceGpio) return [];
    
    const gpio = parseInt(sourceGpio);
    if (isNaN(gpio)) return [];

    // Filter existing active schedules for this specific GPIO
    return schedules
        .filter(s => s.type === 'input' && s.sourceGpio === gpio)
        .map(s => s.inputTrigger); // Extract the trigger type
  }, [schedules, sourceGpio, conditionType]);

  // Auto-switch trigger if the selected one becomes taken when changing GPIO
  useEffect(() => {
    if (conditionType === 'input' && takenTriggers.includes(inputTrigger)) {
        // Find the first option that isn't taken
        const availableOption = TRIGGER_OPTIONS.find(opt => !takenTriggers.includes(opt.value));
        if (availableOption) {
            setInputTrigger(availableOption.value as ButtonTrigger);
        }
    }
  }, [takenTriggers, inputTrigger, conditionType]);

  // Auto-select first weather source
  useEffect(() => {
    if (conditionType === 'weather' && !weatherSourceId && weatherSegments.length > 0) {
        setWeatherSourceId(weatherSegments[0].num_of_node);
    }
  }, [conditionType, weatherSegments, weatherSourceId]);

  useEffect(() => {
    if (isPurePwm) {
        setAction('SET_VALUE');
    } else if (isHybrid) {
        setHybridMode('digital');
        setAction('ON');
    } else {
        setAction('ON');
    }
  }, [targetId, isPurePwm, isHybrid]);

  useEffect(() => {
    if (isHybrid) {
        if (hybridMode === 'pwm') {
            setAction('SET_VALUE');
        } else {
            setAction('ON');
        }
    }
  }, [hybridMode, isHybrid]);

  const handleAdd = () => {
    if (!targetId) return;
    if (conditionType === 'daily' && !time) return;
    if (conditionType === 'countdown' && (timerHours === 0 && timerMinutes === 0 && timerSeconds === 0)) return;
    if (conditionType === 'input') {
        if (!sourceGpio) return;
        if (takenTriggers.includes(inputTrigger)) return;
    }
    if (conditionType === 'weather') {
        if (!weatherSourceId) return;
        if (isNaN(weatherValue)) return;
    }

    const duration = (timerHours * 3600) + (timerMinutes * 60) + timerSeconds;

    addSchedule({
        id: Math.random().toString(36).substr(2, 9),
        type: conditionType,
        time: conditionType === 'daily' ? time : undefined,
        duration: conditionType === 'countdown' ? duration : undefined,
        startedAt: conditionType === 'countdown' ? Date.now() : undefined,
        
        // Input Props
        sourceGpio: conditionType === 'input' ? parseInt(sourceGpio) : undefined,
        inputTrigger: conditionType === 'input' ? inputTrigger : undefined,

        // Weather Props
        sourceSegmentId: conditionType === 'weather' ? weatherSourceId : undefined,
        conditionMetric: conditionType === 'weather' ? weatherMetric : undefined,
        conditionOperator: conditionType === 'weather' ? weatherOperator : undefined,
        conditionValue: conditionType === 'weather' ? weatherValue : undefined,

        targetSegmentId: targetId,
        action: showPwmTools ? 'SET_VALUE' : action,
        targetValue: showPwmTools ? pwmValue : undefined,
        enabled: true,
        repeatMode: repeatMode,
        repeatCount: repeatMode === 'count' ? repeatCount : undefined
    });
    
    // Reset defaults
    setTargetId("");
    setAction("ON");
    setPwmValue(128);
    setTimerHours(0);
    setTimerMinutes(30);
    setTimerSeconds(0);
    setRepeatMode('daily');
    setRepeatCount(1);
  };

  const hasWeatherSensors = weatherSegments.length > 0;

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 text-primary font-black text-[10px] uppercase tracking-widest border-b border-border/40 pb-2">
            <Plus size={12} /> {t.add_schedule}
        </div>

        {/* Condition Type Switcher */}
        <div className={cn("grid gap-2 mb-2", hasWeatherSensors ? "grid-cols-4" : "grid-cols-3")}>
            <button
                onClick={() => setConditionType('daily')}
                className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider",
                    conditionType === 'daily' 
                        ? "bg-primary/20 border-primary text-primary shadow-sm" 
                        : "bg-transparent border-white/10 text-muted-foreground hover:bg-secondary/10"
                )}
            >
                <Clock size={12} /> {t.condition_time || "Time"}
            </button>
            <button
                onClick={() => setConditionType('countdown')}
                className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider",
                    conditionType === 'countdown' 
                        ? "bg-primary/20 border-primary text-primary shadow-sm" 
                        : "bg-transparent border-white/10 text-muted-foreground hover:bg-secondary/10"
                )}
            >
                <Timer size={12} /> {t.condition_timer || "Timer"}
            </button>
            <button
                onClick={() => setConditionType('input')}
                className={cn(
                    "flex items-center justify-center gap-1.5 h-10 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider",
                    conditionType === 'input' 
                        ? "bg-primary/20 border-primary text-primary shadow-sm" 
                        : "bg-transparent border-white/10 text-muted-foreground hover:bg-secondary/10"
                )}
            >
                <Cable size={12} /> {t.condition_input || "Input"}
            </button>
            {hasWeatherSensors && (
                <button
                    onClick={() => setConditionType('weather')}
                    className={cn(
                        "flex items-center justify-center gap-1.5 h-10 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider",
                        conditionType === 'weather' 
                            ? "bg-primary/20 border-primary text-primary shadow-sm" 
                            : "bg-transparent border-white/10 text-muted-foreground hover:bg-secondary/10"
                    )}
                >
                    <CloudFog size={12} /> Weather
                </button>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Dynamic Left Input: Time, Timer, Input, or Weather */}
            <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {conditionType === 'daily' ? t.exec_time : 
                        conditionType === 'countdown' ? 'Duration' : 
                        conditionType === 'input' ? t.input_config || "Input Config" : "Sensor Condition"}
                </label>
                
                {conditionType === 'daily' && (
                    <Input 
                        type="time" 
                        step="1" 
                        value={time} 
                        onChange={(e) => setTime(e.target.value)}
                        className="h-12 text-lg text-center tracking-widest font-mono"
                    />
                )}

                {conditionType === 'countdown' && (
                    <div className="flex gap-1">
                        <div className="flex-1 relative">
                            <Input 
                                type="number" 
                                min="0"
                                value={timerHours} 
                                onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)}
                                className="h-12 text-lg text-center font-mono pl-1"
                            />
                            <span className="absolute right-2 bottom-1 text-[7px] text-muted-foreground font-black uppercase">HR</span>
                        </div>
                        <div className="flex-1 relative">
                            <Input 
                                type="number" 
                                min="0"
                                max="59"
                                value={timerMinutes} 
                                onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                                className="h-12 text-lg text-center font-mono pl-1"
                            />
                            <span className="absolute right-2 bottom-1 text-[7px] text-muted-foreground font-black uppercase">MIN</span>
                        </div>
                        <div className="flex-1 relative">
                            <Input 
                                type="number" 
                                min="0"
                                max="59"
                                value={timerSeconds} 
                                onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
                                className="h-12 text-lg text-center font-mono pl-1"
                            />
                            <span className="absolute right-2 bottom-1 text-[7px] text-muted-foreground font-black uppercase">SEC</span>
                        </div>
                    </div>
                )}

                {conditionType === 'input' && (
                    <div className="flex gap-2">
                        <div className="flex-[0.4] relative">
                            <Input 
                                type="number" 
                                placeholder="PIN"
                                value={sourceGpio} 
                                onChange={(e) => setSourceGpio(e.target.value)}
                                className="h-12 text-center font-mono font-bold"
                            />
                            <span className="absolute left-2 bottom-1 text-[6px] text-muted-foreground font-black uppercase">GPIO</span>
                        </div>
                        <div className="flex-1 relative">
                            <select
                                value={inputTrigger}
                                onChange={(e) => setInputTrigger(parseInt(e.target.value) as ButtonTrigger)}
                                className="w-full h-12 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none text-center"
                            >
                                {TRIGGER_OPTIONS.map(opt => {
                                    const isTaken = takenTriggers.includes(opt.value);
                                    return (
                                        <option 
                                            key={opt.value} 
                                            value={opt.value} 
                                            disabled={isTaken}
                                            className={isTaken ? "text-red-500 bg-red-500/10 italic" : ""}
                                        >
                                            {opt.label} {isTaken ? '(Active)' : ''}
                                        </option>
                                    )
                                })}
                            </select>
                            <span className="absolute right-2 bottom-1 text-[6px] text-muted-foreground font-black uppercase">TRIGGER</span>
                        </div>
                    </div>
                )}

                {conditionType === 'weather' && (
                    <div className="space-y-2">
                        <select 
                            value={weatherSourceId}
                            onChange={(e) => setWeatherSourceId(e.target.value)}
                            className="w-full h-8 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-2 text-[10px] font-bold outline-none mb-1"
                        >
                            {weatherSegments.map(s => (
                                <option key={s.num_of_node} value={s.num_of_node}>{s.name} (GPIO {s.dhtPin})</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                                {/* Metric Toggle */}
                            <button 
                                onClick={() => setWeatherMetric(weatherMetric === 'temp' ? 'hum' : 'temp')}
                                className="w-8 h-8 rounded-md bg-secondary/20 flex items-center justify-center border border-white/10 text-primary"
                                title={weatherMetric === 'temp' ? 'Temperature' : 'Humidity'}
                            >
                                {weatherMetric === 'temp' ? <Thermometer size={14} /> : <Droplets size={14} />}
                            </button>

                            {/* Operator */}
                            <select 
                                value={weatherOperator}
                                onChange={(e) => setWeatherOperator(e.target.value as any)}
                                className="w-10 h-8 rounded-md bg-secondary/20 border border-white/10 text-center font-mono font-bold text-xs"
                            >
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value="=">=</option>
                            </select>

                            {/* Value */}
                            <div className="flex-1 relative">
                                <Input 
                                    type="number" 
                                    value={weatherValue} 
                                    onChange={(e) => setWeatherValue(parseInt(e.target.value))}
                                    className="h-8 text-center font-mono pr-5"
                                />
                                <span className="absolute right-1.5 top-1.5 text-[8px] text-muted-foreground font-black">
                                    {weatherMetric === 'temp' ? '°C' : '%'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Target Segment */}
            <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.target_device}</label>
                    <select 
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full h-12 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    >
                        <option value="">-- Select --</option>
                        {allowedSegments.map(s => (
                            <option key={s.num_of_node} value={s.num_of_node}>
                            {s.name} ({s.segType}) GP-{s.gpio}
                            </option>
                        ))}
                    </select>
            </div>
        </div>

        {/* Repetition Protocol Section - Only for Daily (Time) conditions */}
        {conditionType === 'daily' && (
            <div className="bg-secondary/5 rounded-xl p-3 border border-border/50">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Repeat size={12} /> Repetition Protocol
                </label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setRepeatMode('daily')}
                        className={cn(
                            "flex-1 h-9 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                            repeatMode === 'daily' ? "bg-primary text-black border-primary" : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Infinity size={12} /> Always
                    </button>
                    <button 
                        onClick={() => setRepeatMode('once')}
                        className={cn(
                            "flex-1 h-9 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                            repeatMode === 'once' ? "bg-primary text-black border-primary" : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Check size={12} /> Once
                    </button>
                    <button 
                        onClick={() => setRepeatMode('count')}
                        className={cn(
                            "flex-1 h-9 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                            repeatMode === 'count' ? "bg-primary text-black border-primary" : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        <Hash size={12} /> Count
                    </button>
                </div>
                {repeatMode === 'count' && (
                    <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                        <Input 
                            type="number" 
                            placeholder="Count" 
                            value={repeatCount}
                            onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                            className="h-8 text-center"
                        />
                    </MotionDiv>
                )}
            </div>
        )}

        {/* Hybrid Mode Selector */}
        <AnimatePresence>
            {isHybrid && targetId && (
                <MotionDiv 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.suggested_tool}</label>
                        <div className="flex gap-2 p-1 bg-secondary/10 rounded-lg">
                            <button 
                                onClick={() => setHybridMode('digital')}
                                className={cn(
                                    "flex-1 h-8 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                    hybridMode === 'digital' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Digital Mode
                            </button>
                            <button 
                                onClick={() => setHybridMode('pwm')}
                                className={cn(
                                    "flex-1 h-8 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                    hybridMode === 'pwm' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                PWM Mode
                            </button>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Action Logic - Only visible when Target is selected */}
        <AnimatePresence>
            {targetId && (
                <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                >
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.action_type}</label>
                    
                    {showPwmTools ? (
                        <div className="space-y-4 p-3 bg-secondary/5 rounded-xl border border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-muted-foreground">{t.set_pwm_val}</span>
                                <span className="text-xs font-mono font-bold text-primary">{pwmValue}</span>
                            </div>
                            <Slider
                                value={[pwmValue]}
                                onValueChange={(val) => setPwmValue(val[0])}
                                max={255}
                                step={1}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setAction('ON')}
                                className={cn(
                                    "h-10 rounded-lg border transition-all flex flex-col items-center justify-center",
                                    action === 'ON' ? "bg-green-500/20 border-green-500 text-green-500 shadow-sm" : "bg-transparent border-white/10 text-muted-foreground hover:bg-green-500/5"
                                )}
                            >
                                <Power size={14} className="mb-0.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">{t.action_on}</span>
                            </button>
                            <button
                                onClick={() => setAction('OFF')}
                                className={cn(
                                    "h-10 rounded-lg border transition-all flex flex-col items-center justify-center",
                                    action === 'OFF' ? "bg-red-500/20 border-red-500 text-red-500 shadow-sm" : "bg-transparent border-white/10 text-muted-foreground hover:bg-red-500/5"
                                )}
                            >
                                <Power size={14} className="mb-0.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">{t.action_off}</span>
                            </button>
                            <button
                                onClick={() => setAction('TOGGLE')}
                                className={cn(
                                    "h-10 rounded-lg border transition-all flex flex-col items-center justify-center",
                                    action === 'TOGGLE' ? "bg-blue-500/20 border-blue-500 text-blue-500 shadow-sm" : "bg-transparent border-white/10 text-muted-foreground hover:bg-blue-500/5"
                                )}
                            >
                                <ToggleLeft size={14} className="mb-0.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">{t.action_toggle}</span>
                            </button>
                        </div>
                    )}
                </MotionDiv>
            )}
        </AnimatePresence>

        <Button onClick={handleAdd} className="w-full gap-2 font-black text-[10px] uppercase tracking-[0.2em]">
            <Plus size={14} /> {t.add_schedule}
        </Button>
    </div>
  );
};
