
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Settings, Zap, CalendarClock, Hash } from 'lucide-react';
import { useSettingsStore } from '../../lib/store/settings';
import { useCursorStore } from '../../lib/store/cursorStore';
import { useSoundFx } from '../../hooks/useSoundFx';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';
import { ConnectionStatus } from './ConnectionStatus';

// Motion Components Definitions to fix "Cannot find name" errors
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;
const MotionButton = motion.button as any;
const MotionPath = motion.path as any;
const MotionRect = motion.rect as any;
const MotionCircle = motion.circle as any;
const MotionSvg = motion.svg as any;

interface HeaderProps {
    onOpenMenu: () => void;
}

// --- Helper: Generate Jagged Path Data ---
const generateJaggedPath = (startX: number, startY: number, endX: number, endY: number, segments: number, amplitude: number) => {
    let d = `M ${startX} ${startY}`;
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        const offset = (Math.random() - 0.5) * amplitude;
        const jitterX = (Math.random() - 0.5) * (amplitude / 3);
        d += ` L ${x + jitterX} ${y + offset}`;
    }
    d += ` L ${endX} ${endY}`;
    return d;
};

// --- Helper: Generate Smooth Sine Wave Path ---
const generateSinePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 100; // Resolution
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        // Formula: y = A * sin(Bx + C) + D
        // We calculate the Y based on the phase offset to simulate travel
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        const y = yCenter + Math.sin(theta) * amplitude;
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- Helper: Generate Soft Square Wave Path (High Quality) ---
const generateSquarePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 200; 
    let d = `M 0 ${yCenter}`;
    
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        
        // Use Hyperbolic Tangent of Sine to create a "Soft Square" wave.
        // This removes aliasing artifacts and vertical jitter, making it look like a high-quality analog signal.
        // Multiplier (5) controls the sharpness of the edges.
        const val = Math.tanh(Math.sin(theta) * 5);
        
        const y = yCenter - (val * amplitude); 
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- Helper: Generate Sawtooth Wave Path ---
const generateSawtoothPath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 100;
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const rawPhase = ((t * cycles) + (phaseOffset / (Math.PI * 2))) % 1;
        const ramp = (rawPhase < 0 ? 1 + rawPhase : rawPhase) * 2 - 1;
        const y = yCenter - (ramp * amplitude);
        d += ` L ${x} ${y}`;
    }
    return d;
};

// --- NEW Electric Connection Component ---
const ElectricConnection = React.memo(({ color, width, left, opacity, dynamicIntensity }: { color: string, width: number, left: number, opacity: number, dynamicIntensity: boolean }) => {
  const PHASE_SHIFT = (2 * Math.PI) / 3; // 120 degrees in radians

  // 1. Square Wave Frames (Soft Analog Style) with SHARPER Rising Edge Pulse
  const squareWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.6;
      const cycles = 4; // Must match generateSquarePath
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSquarePath(100, 5, cycles, 3, phase));
          
          if (dynamicIntensity) {
              // SMOOTH ANALOG PULSE
              // Rising Edge happens when cos(phase) approaches 1.
              const cosVal = Math.cos(phase);
              
              // Normalize to 0..1
              const proximity = (cosVal + 1) / 2;
              
              // SHARPER PULSE: Increased power from 12 to 24
              // This makes the "glow" duration much shorter/snappier
              const intensity = Math.pow(proximity, 24);
              
              opacities.push(baseOpacity + (intensity * 0.4)); 
              // THINNER PULSE: Reduced multiplier from 2 to 1.2
              widths.push(1 + (intensity * 1.2)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(1);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  // 2. Sine Wave Frames (Strict 3-Phase AC)
  const sineWaveData = useMemo(() => {
      const framesA = [];
      const framesB = [];
      const framesC = [];
      
      const opacityA = [];
      const opacityB = [];
      const opacityC = [];

      const steps = 60; // 60fps equivalent for smoothness
      const baseOpacity = 0.6;
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const movePhase = -Math.PI * 2 * progress; 
          const stableAmp = 8; 

          // Paths
          framesA.push(generateSinePath(100, 20, 2, stableAmp, movePhase));
          framesB.push(generateSinePath(100, 20, 2, stableAmp, movePhase + PHASE_SHIFT));
          framesC.push(generateSinePath(100, 20, 2, stableAmp, movePhase + (PHASE_SHIFT * 2)));

          // Dynamic Intensity Logic
          if (dynamicIntensity) {
              const centerT = 0.5; // Center of screen
              const theta = (centerT * 2 * Math.PI * 2) + movePhase;
              
              const calcOpacity = (offset: number) => {
                  const val = Math.sin(theta + offset);
                  // Glow when absolute value is near 1 (Peak positive or negative)
                  const peakProximity = Math.pow(Math.abs(val), 3); // smooth curve
                  return baseOpacity + (peakProximity * 0.4); 
              };

              opacityA.push(calcOpacity(0));
              opacityB.push(calcOpacity(PHASE_SHIFT));
              opacityC.push(calcOpacity(PHASE_SHIFT * 2));
          } else {
              opacityA.push(baseOpacity);
              opacityB.push(baseOpacity);
              opacityC.push(baseOpacity);
          }
      }
      return { 
          frames: { A: framesA, B: framesB, C: framesC },
          opacities: { A: opacityA, B: opacityB, C: opacityC }
      };
  }, [dynamicIntensity]);

  // 3. Sawtooth Wave Frames (Ramp) with SHARPER Reset Flash
  const sawtoothWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.4;
      const cycles = 3; // Must match generateSawtoothPath

      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSawtoothPath(100, 35, cycles, 3, phase));

          if (dynamicIntensity) {
              // SMOOTH ANALOG RESET
              // Calculate continuous distance to the "Reset" point.
              const phaseNorm = phase / (Math.PI * 2);
              const rawPos = (0.5 * cycles) + phaseNorm;
              
              // Distance to nearest integer (the drop point). Ranges 0 to 0.5
              const dist = Math.abs(rawPos - Math.round(rawPos)); 
              
              // Normalize: 1 when at reset
              const proximity = 1 - (dist * 2);
              
              // SHARPER PULSE: Increased power from 10 to 24
              const intensity = Math.pow(proximity, 24);
              
              opacities.push(baseOpacity + (intensity * 0.6));
              // THINNER PULSE: Reduced multiplier from 1.5 to 1.0
              widths.push(0.8 + (intensity * 1.0)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(0.8);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  return (
    // Dynamic Positioning based on Header Gap
    <div 
      className="absolute top-0 bottom-0 flex items-center justify-center overflow-visible pointer-events-none z-0"
      style={{
          left: `${left}px`,
          width: `${width}px`,
          opacity: opacity
      }}
    >
       <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="stream-fade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity="0" />
                <stop offset="15%" stopColor={color} stopOpacity="0.8" />
                <stop offset="85%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id="plasma-glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>
          
          {/* Layer 0: Central Data Bus (Main Wire) */}
          <MotionPath
             d="M 0 20 L 100 20"
             stroke={color}
             strokeWidth="1"
             strokeDasharray="3 5"
             fill="none"
             strokeOpacity="0.1"
             animate={{ strokeDashoffset: [-16, 0] }}
             transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          />

          {/* --- TOP RAIL: SQUARE WAVE (Digital Clock) --- */}
          <path d="M 0 5 L 100 5" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="1 2" />
          <MotionPath
             stroke={color}
             strokeWidth={squareWaveData.widths} // Animate Width
             fill="none"
             strokeOpacity={squareWaveData.opacities} // Animate Opacity
             animate={{ d: squareWaveData.frames, strokeOpacity: squareWaveData.opacities, strokeWidth: squareWaveData.widths }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <MotionRect
            width="2"
            height="2"
            fill={color}
            initial={{ x: 0, y: 4, opacity: 0 }}
            animate={{ x: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* --- BOTTOM RAIL: SAWTOOTH WAVE (Ramp) --- */}
          <MotionPath
             stroke={color}
             strokeWidth={sawtoothWaveData.widths} // Animate Width
             fill="none"
             strokeOpacity={sawtoothWaveData.opacities} // Animate Opacity
             animate={{ d: sawtoothWaveData.frames, strokeOpacity: sawtoothWaveData.opacities, strokeWidth: sawtoothWaveData.widths }}
             transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          {/* --- CENTER: 3-PHASE AC (Uniform Style) --- */}
          
          {/* Phase A (L1) */}
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.A} // Pulse Opacity
             animate={{ d: sineWaveData.frames.A, strokeOpacity: sineWaveData.opacities.A }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Phase B (L2) */}
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.B} // Pulse Opacity
             animate={{ d: sineWaveData.frames.B, strokeOpacity: sineWaveData.opacities.B }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Phase C (L3) */}
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.C} // Pulse Opacity
             animate={{ d: sineWaveData.frames.C, strokeOpacity: sineWaveData.opacities.C }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Central Analog Electrons - Particle Flow */}
          <MotionCircle 
            r="1.5" 
            fill="white"
            filter="url(#plasma-glow)"
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
           <MotionCircle 
            r="1" 
            fill={color}
            initial={{ cx: 0, cy: 20, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />

       </svg>
    </div>
  )
});

// --- NEW COMPONENT: TIGHT Lightning Ring (Corrected Size) ---
const LightningRing = () => (
  // Reduced negative inset from -24px to -6px to pull the effect tight to the logo box
  <div className="absolute inset-[-6px] z-0 pointer-events-none flex items-center justify-center">
    
    {/* Inner Rotating Bolt Layer */}
    <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
            <defs>
                <filter id="bolt-noise-inner">
                    <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="4" result="noise">
                        <animate attributeName="seed" values="0;100" dur="0.4s" repeatCount="indefinite" />
                    </feTurbulence>
                    {/* Reduced scale from 6 to 3 to prevent lightning from spiking too far out */}
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    <feGaussianBlur stdDeviation="0.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            
            {/* Primary Gold/Color Lightning - Radius reduced from 32 to 24 */}
            <circle cx="50" cy="50" r="24" 
                fill="none" 
                stroke="hsl(var(--primary))" 
                strokeWidth="2" 
                filter="url(#bolt-noise-inner)"
                strokeDasharray="40 20 10 30"
                strokeLinecap="round"
                opacity="0.9"
            />
        </svg>
    </div>
    
    {/* Outer Rotating Bolt Layer (Reverse) */}
    <div className="absolute inset-0 animate-[spin_12s_linear_infinite_reverse]">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
            <defs>
                <filter id="bolt-noise-outer">
                    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise">
                        <animate attributeName="seed" values="100;0" dur="0.6s" repeatCount="indefinite" />
                    </feTurbulence>
                    {/* Reduced scale from 8 to 4 */}
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            
            {/* Secondary White/Blue Lightning - Radius reduced from 40 to 30 */}
            <circle cx="50" cy="50" r="30" 
                fill="none" 
                stroke="white" 
                strokeWidth="1" 
                filter="url(#bolt-noise-outer)"
                strokeDasharray="25 50 15 40"
                strokeLinecap="round"
                opacity="0.7"
            />
        </svg>
    </div>
  </div>
);

const SparkBolt = ({ active }: { active: boolean }) => {
    const path1 = generateJaggedPath(100, 10, 0, 10, 8, 15);
    const path2 = generateJaggedPath(100, 10, 0, 10, 12, 10);
    const path3 = generateJaggedPath(100, 10, 0, 10, 6, 5);

    return (
        <div className="absolute top-1/2 left-8 right-0 -translate-y-1/2 h-20 pointer-events-none z-20 overflow-visible">
            <AnimatePresence>
                {active && (
                    <MotionSvg
                        viewBox="0 0 100 20"
                        className="w-full h-full overflow-visible"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <defs>
                            <filter id="bolt-glow-dense" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        
                        <MotionPath
                            d={path1}
                            stroke="hsl(var(--primary))"
                            strokeWidth="6"
                            strokeOpacity="0.2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#bolt-glow-dense)"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.1, ease: "linear" }}
                        />

                        <MotionPath
                            d={path2}
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#bolt-glow-dense)"
                            initial={{ pathLength: 0, opacity: 0.5 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        />

                        <MotionPath
                            d={path3}
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        />

                        <MotionCircle cx="80" cy="10" r="1.5" fill="white" initial={{ opacity:0, cx:90 }} animate={{ opacity: [0,1,0], cx: 60, cy: 5 }} transition={{ duration: 0.3 }} />
                        <MotionCircle cx="50" cy="10" r="1" fill="hsl(var(--primary))" initial={{ opacity:0 }} animate={{ opacity: [0,1,0], cx: 40, cy: 15 }} transition={{ duration: 0.3, delay: 0.05 }} />
                        <MotionCircle cx="20" cy="10" r="1.5" fill="white" initial={{ opacity:0 }} animate={{ opacity: [0,1,0], cx: 10, cy: 2 }} transition={{ duration: 0.3, delay: 0.1 }} />
                    </MotionSvg>
                )}
            </AnimatePresence>
        </div>
    );
};

const CursorDischargeBolt = ({ start, end }: { start: {x:number, y:number} | null, end: {x:number, y:number} | null }) => {
    if (!start || !end) return null;

    const path1 = generateJaggedPath(start.x, start.y, end.x, end.y, 8, 40);
    const path2 = generateJaggedPath(start.x, start.y, end.x, end.y, 12, 20);
    const path3 = generateJaggedPath(start.x, start.y, end.x, end.y, 6, 10);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-visible">
             <svg className="w-full h-full overflow-visible">
                <defs>
                    <filter id="cursor-bolt-glow-dense">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                
                <MotionPath
                    d={path1}
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeOpacity="0.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cursor-bolt-glow-dense)"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0] }}
                    transition={{ duration: 0.2, ease: "linear" }}
                />

                <MotionPath
                    d={path2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cursor-bolt-glow-dense)"
                    initial={{ pathLength: 0, opacity: 1, strokeWidth: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0], strokeWidth: [2, 5, 0] }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                />

                <MotionPath
                    d={path3}
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 0] }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                />
             </svg>
        </div>
    )
}

const GlitchTitle = ({ text, active, discharging }: { text: string, active: boolean, discharging: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const trigger = active && (isHovered || discharging);

  const baseClass = "text-sm md:text-lg font-black uppercase tracking-tighter leading-none text-foreground select-none relative inline-block transition-colors duration-100";

  return (
    <div 
        className="relative group cursor-default"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        <h1 className={cn(baseClass, "z-10 relative", discharging && "text-primary/50 mix-blend-hard-light")}>
            {text}
        </h1>

        <AnimatePresence>
            {trigger && (
                <>
                    <MotionSpan
                        className={cn(baseClass, "absolute top-0 left-0 text-red-500 opacity-70 z-0 mix-blend-screen")}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ 
                            x: [-2, 2, -1, 0], 
                            y: [1, -1, 0],
                            opacity: [0.8, 1, 0],
                            clipPath: ["inset(0 0 0 0)", "inset(10% 0 80% 0)", "inset(80% 0 10% 0)", "inset(0 0 0 0)"]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </MotionSpan>

                    <MotionSpan
                        className={cn(baseClass, "absolute top-0 left-0 text-blue-500 opacity-70 z-0 mix-blend-screen")}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{ 
                            x: [2, -2, 1, 0], 
                            y: [-1, 1, 0],
                            opacity: [0.8, 1, 0],
                            clipPath: ["inset(0 0 0 0)", "inset(80% 0 5% 0)", "inset(10% 0 60% 0)", "inset(0 0 0 0)"]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </MotionSpan>
                </>
            )}
        </AnimatePresence>
    </div>
  );
};

const TimeDigit = ({ val }: { val: string }) => (
  <div className="relative h-6 w-3.5 md:h-8 md:w-5 overflow-hidden flex items-center justify-center">
    <AnimatePresence mode="popLayout">
      <MotionSpan
        key={val}
        initial={{ y: -10, opacity: 0, filter: 'blur(2px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 10, opacity: 0, filter: 'blur(2px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center font-dina text-lg md:text-xl font-bold leading-none pb-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--foreground))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
      >
        {val}
      </MotionSpan>
    </AnimatePresence>
  </div>
);

const Separator = () => (
  <MotionSpan 
    animate={{ opacity: [0.3, 1, 0.3] }} 
    transition={{ duration: 1, repeat: Infinity }}
    className="font-dina text-lg md:text-xl font-bold mx-px -mt-0.5 text-transparent bg-clip-text bg-gradient-to-t from-[hsl(var(--primary))] from-50% to-[hsl(var(--primary))] to-50% bg-[length:100%_200%] bg-top group-hover:bg-bottom transition-[background-position] duration-500 ease-out"
  >
    :
  </MotionSpan>
);

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { setCharged } = useCursorStore();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const [timeParts, setTimeParts] = useState<{h: string[], m: string[], s: string[]}>({ h:['0','0'], m:['0','0'], s:['0','0'] });
  const [sparkState, setSparkState] = useState<'idle' | 'discharge' | 'impact'>('idle');
  const [isLogoCharged, setIsLogoCharged] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const [cursorBolt, setCursorBolt] = useState<{start: {x:number, y:number}, end: {x:number, y:number}} | null>(null);

  const { playClick, playToggle, playSpark, playCharge } = useSoundFx();
  const t = translations[settings.language];

  const gapSize = settings.headerGap ?? 160;
  // Calculate dynamic dimensions to ensure wave covers the gap + overlap
  const waveWidth = gapSize + 120; // Gap + 120px overlap total
  const waveLeft = -(gapSize + 60); // Offset to the left to reach other island

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0').split('');
        const m = now.getMinutes().toString().padStart(2, '0').split('');
        const s = now.getSeconds().toString().padStart(2, '0').split('');
        setTimeParts({ h, m, s });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (!settings.animations) return;
      const loop = setInterval(() => {
          setSparkState('discharge');
          playSpark(); 
          setTimeout(() => {
              setSparkState('impact');
              playCharge();
              setIsLogoCharged(true);
              setTimeout(() => {
                  setIsLogoCharged(false);
              }, 3000);
          }, 250);
          setTimeout(() => {
              setSparkState('idle');
          }, 750);
      }, 6000); 
      return () => clearInterval(loop);
  }, [settings.animations, playSpark, playCharge]);

  useEffect(() => {
      if (!isLogoCharged || !logoRef.current) return;
      const handleMouseMove = (e: MouseEvent) => {
          if (!isLogoCharged) return; 
          const rect = logoRef.current!.getBoundingClientRect();
          const logoCenterX = rect.left + rect.width / 2;
          const logoCenterY = rect.top + rect.height / 2;
          const dist = Math.hypot(e.clientX - logoCenterX, e.clientY - logoCenterY);
          if (dist < 150) {
              playSpark();
              setCursorBolt({
                  start: { x: logoCenterX, y: logoCenterY },
                  end: { x: e.clientX, y: e.clientY }
              });
              setIsLogoCharged(false);
              setCharged(true);
              setTimeout(() => {
                  setCharged(false);
              }, 1500);
              setTimeout(() => setCursorBolt(null), 300);
          }
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLogoCharged, playSpark, setCharged]);

  const toggleTheme = () => {
    playToggle(settings.theme === 'light');
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleLanguage = () => {
    playToggle(settings.language === 'en');
    updateSettings({ language: settings.language === 'en' ? 'fa' : 'en' });
  };

  const handleOpenMenu = () => {
    playClick();
    onOpenMenu();
  };

  const handleOpenScheduler = () => {
    playClick();
    setIsSchedulerOpen(true);
  };

  const islandVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.9 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20, mass: 1.5 }
    }
  };

  const logoVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      filter: 'drop-shadow(0 0 0px rgba(218,165,32,0))',
      color: "hsl(var(--primary))",
    },
    impact: {
      scale: [1, 1.3, 1.1, 1],
      rotate: [0, -10, 10, 0],
      filter: [
          'drop-shadow(0 0 0px rgba(218,165,32,0))',
          'drop-shadow(0 0 20px rgba(255,255,255,0.9))', 
          'drop-shadow(0 0 10px rgba(218,165,32,0.5))'
      ],
      color: ["hsl(var(--primary))", "#ffffff", "hsl(var(--primary))"], 
      transition: { duration: 0.4, ease: "backOut" }
    },
    charged: {
        scale: [1, 1.05, 1],
        filter: 'drop-shadow(0 0 8px rgba(218,165,32,0.8))',
        transition: { duration: 1, repeat: Infinity, repeatType: "reverse" }
    }
  };

  const CLIP_LEFT = "polygon(12px 0, 100% 0, calc(100% - 24px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
  const CLIP_RIGHT = "polygon(24px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)";

  return (
    <header className="sticky top-2 md:top-6 z-50 px-2 md:px-8 transition-all duration-500 pointer-events-none">
      {/* Dynamic Gap applied via style */}
      <div 
        className="max-w-[1400px] mx-auto flex items-stretch justify-between relative pointer-events-auto h-[60px] md:h-[72px]"
        style={{ gap: `${gapSize}px` }}
      >
        {cursorBolt && <CursorDischargeBolt start={cursorBolt.start} end={cursorBolt.end} />}
        <MotionDiv
          variants={islandVariants}
          initial="hidden"
          animate="visible"
          className="relative min-w-[180px] md:min-w-[280px] drop-shadow-xl filter group z-30" 
        >
           <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_LEFT }} />
           <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_LEFT }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
           </div>
           <div className="relative h-full w-full flex items-center pl-6 pr-10 md:pl-8 md:pr-14">
              <div className="flex items-center gap-3 md:gap-4 z-10 relative w-full">
                  <div ref={logoRef} className="relative z-30 group">
                    {/* Realistic Rotating Lightning Frame - Visible when NOT charged */}
                    {!isLogoCharged && <LightningRing />}

                    <MotionDiv 
                        className={cn(
                            "relative p-1.5 md:p-2 rounded-xl cursor-pointer transition-all duration-500",
                            // If charged: Solid border + background glow (Plasma Core idea)
                            isLogoCharged 
                                ? "bg-primary/20 border-2 border-primary shadow-[0_0_30px_rgba(218,165,32,0.6)]" 
                                : "bg-background/80" // Transparent-ish background to show sparks better
                        )}
                        animate={sparkState === 'impact' ? 'impact' : (isLogoCharged ? 'charged' : 'idle')}
                        variants={logoVariants}
                    >
                        {/* Plasma Core Glow (Implementation of "Plasma Core" idea) - Only when charged */}
                        {isLogoCharged && (
                            <MotionDiv 
                                layoutId="plasma-core"
                                className="absolute inset-0 bg-primary/30 blur-md rounded-xl"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}

                        <Zap 
                            className={cn(
                                "w-4 h-4 md:w-6 md:h-6 transition-all duration-500 z-10 relative",
                                isLogoCharged ? "fill-primary text-white drop-shadow-[0_0_10px_white]" : "fill-transparent text-primary"
                            )} 
                            strokeWidth={isLogoCharged ? 0 : 2} 
                        />
                    </MotionDiv>
                  </div>
                  <SparkBolt active={sparkState === 'discharge'} />
                  <div className="flex flex-col justify-center gap-0.5 relative z-30">
                    <div className="flex items-center gap-2">
                        <div className="p-0.5 bg-primary/20 rounded-sm">
                            <Hash size={10} className="text-primary" strokeWidth={3} />
                        </div>
                        <GlitchTitle 
                            text={settings.title} 
                            active={settings.animations} 
                            discharging={sparkState === 'discharge'} 
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                      <span className={cn("w-1.5 h-1.5 rounded-sm transition-colors", sparkState === 'impact' ? "bg-white shadow-[0_0_5px_white]" : "bg-primary")} /> 
                      {t.node_controller}
                    </div>
                  </div>
              </div>
           </div>
        </MotionDiv>
        <MotionDiv
            variants={islandVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="relative flex-1 drop-shadow-xl filter"
        >
            {/* CONDITIONAL RENDER: Only show electric waves if animations are enabled */}
            {settings.animations && (
                <ElectricConnection 
                    color={settings.cursorColor || "#daa520"} 
                    width={waveWidth} 
                    left={waveLeft}
                    opacity={(settings.headerWaveOpacity ?? 90) / 100}
                    dynamicIntensity={settings.headerDynamicIntensity || false}
                />
            )}
            
            <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-xl" style={{ clipPath: CLIP_RIGHT }} />
            <div className="absolute inset-[2px] bg-background/90 dark:bg-[#0c0c0e]/95 backdrop-blur-3xl overflow-hidden" style={{ clipPath: CLIP_RIGHT }}>
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/5 to-transparent opacity-50" />
            </div>
            <div className="relative h-full w-full flex items-center justify-between pl-10 pr-6 md:pl-14 md:pr-8">
               <div className="hidden lg:flex flex-col items-start justify-center pl-4 border-l-2 border-border/30 h-auto py-1">
                  <MotionDiv 
                    whileHover={{ scale: 1.05 }}
                    className="group relative px-2 py-1 rounded-lg border border-transparent hover:border-primary/30 transition-all duration-300 cursor-default overflow-hidden"
                  >
                      <div className="relative z-10 flex items-center gap-0.5 md:gap-1 drop-shadow-sm select-none" dir="ltr">
                          <TimeDigit val={timeParts.h[0]} />
                          <TimeDigit val={timeParts.h[1]} />
                          <Separator />
                          <TimeDigit val={timeParts.m[0]} />
                          <TimeDigit val={timeParts.m[1]} />
                          <Separator />
                          <TimeDigit val={timeParts.s[0]} />
                          <TimeDigit val={timeParts.s[1]} />
                      </div>
                  </MotionDiv>
                  <div className="text-[7px] font-black uppercase tracking-[0.4em] text-primary/70 mt-0.5 ml-3">{t.system_time}</div>
               </div>
               <div className="flex items-center gap-2 md:gap-3 z-10 ml-auto">
                  <ControlButton onClick={handleOpenScheduler} icon={CalendarClock} title={t.scheduler} active={isSchedulerOpen} />
                  <div className="w-px h-8 bg-border/40 mx-1 hidden sm:block" />
                  <ControlButton onClick={toggleTheme} icon={settings.theme === 'light' ? Moon : Sun} title={t.switch_env} />
                  <ControlButton onClick={toggleLanguage} label={settings.language === 'en' ? 'FA' : 'EN'} title={t.switch_lang} />
                  <ControlButton onClick={handleOpenMenu} icon={Settings} title={t.sys_config} variant="primary" />
                  <div className="hidden sm:block pl-2 border-l-2 border-border/30">
                    <ConnectionStatus />
                  </div>
               </div>
            </div>
        </MotionDiv>
      </div>
      <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </header>
  );
};

const ControlButton = ({ onClick, icon: Icon, label, title, active, variant = 'default' }: any) => {
    return (
        <MotionButton
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={onClick}
            title={title}
            className={cn(
                "relative h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center transition-all duration-300 border-2 overflow-hidden group",
                variant === 'primary' 
                    ? "bg-primary text-black border-primary shadow-[0_4px_0_rgb(var(--foreground))]"
                    : "bg-background hover:bg-secondary border-border hover:border-primary/50 text-muted-foreground hover:text-primary shadow-sm",
                active && "bg-primary/20 border-primary text-primary"
            )}
        >
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative z-10">
                {Icon ? <Icon size={20} strokeWidth={variant === 'primary' ? 2.5 : 2} /> : <span className="font-black text-xs">{label}</span>}
            </div>
        </MotionButton>
    )
}
