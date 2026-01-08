
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const MotionPath = motion.path as any;
const MotionRect = motion.rect as any;
const MotionCircle = motion.circle as any;

// --- Helper Functions ---
const generateSinePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 100;
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        const y = yCenter + Math.sin(theta) * amplitude;
        d += ` L ${x} ${y}`;
    }
    return d;
};

const generateSquarePath = (width: number, yCenter: number, cycles: number, amplitude: number, phaseOffset: number) => {
    const points = 200; 
    let d = `M 0 ${yCenter}`;
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const x = t * width;
        const theta = (t * cycles * Math.PI * 2) + phaseOffset;
        const val = Math.tanh(Math.sin(theta) * 5);
        const y = yCenter - (val * amplitude); 
        d += ` L ${x} ${y}`;
    }
    return d;
};

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

export const ElectricWaves = React.memo(({ color, width, left, opacity, dynamicIntensity }: { color: string, width: number, left: number, opacity: number, dynamicIntensity: boolean }) => {
  const PHASE_SHIFT = (2 * Math.PI) / 3;

  const squareWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.6;
      const cycles = 4;
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSquarePath(100, 5, cycles, 3, phase));
          
          if (dynamicIntensity) {
              const cosVal = Math.cos(phase);
              const proximity = (cosVal + 1) / 2;
              const intensity = Math.pow(proximity, 24);
              opacities.push(baseOpacity + (intensity * 0.4)); 
              widths.push(1 + (intensity * 1.2)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(1);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  const sineWaveData = useMemo(() => {
      const framesA = [];
      const framesB = [];
      const framesC = [];
      const opacityA = [];
      const opacityB = [];
      const opacityC = [];
      const steps = 60;
      const baseOpacity = 0.6;
      
      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const movePhase = -Math.PI * 2 * progress; 
          const stableAmp = 8; 

          framesA.push(generateSinePath(100, 20, 2, stableAmp, movePhase));
          framesB.push(generateSinePath(100, 20, 2, stableAmp, movePhase + PHASE_SHIFT));
          framesC.push(generateSinePath(100, 20, 2, stableAmp, movePhase + (PHASE_SHIFT * 2)));

          if (dynamicIntensity) {
              const centerT = 0.5;
              const theta = (centerT * 2 * Math.PI * 2) + movePhase;
              const calcOpacity = (offset: number) => {
                  const val = Math.sin(theta + offset);
                  const peakProximity = Math.pow(Math.abs(val), 3);
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

  const sawtoothWaveData = useMemo(() => {
      const frames = [];
      const opacities = [];
      const widths = [];
      const steps = 60; 
      const baseOpacity = 0.4;
      const cycles = 3; 

      for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const phase = -Math.PI * 2 * progress; 
          frames.push(generateSawtoothPath(100, 35, cycles, 3, phase));

          if (dynamicIntensity) {
              const phaseNorm = phase / (Math.PI * 2);
              const rawPos = (0.5 * cycles) + phaseNorm;
              const dist = Math.abs(rawPos - Math.round(rawPos)); 
              const proximity = 1 - (dist * 2);
              const intensity = Math.pow(proximity, 24);
              opacities.push(baseOpacity + (intensity * 0.6));
              widths.push(0.8 + (intensity * 1.0)); 
          } else {
              opacities.push(baseOpacity);
              widths.push(0.8);
          }
      }
      return { frames, opacities, widths };
  }, [dynamicIntensity]);

  return (
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

          <path d="M 0 5 L 100 5" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="1 2" />
          <MotionPath
             stroke={color}
             strokeWidth={squareWaveData.widths}
             fill="none"
             strokeOpacity={squareWaveData.opacities}
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

          <MotionPath
             stroke={color}
             strokeWidth={sawtoothWaveData.widths}
             fill="none"
             strokeOpacity={sawtoothWaveData.opacities}
             animate={{ d: sawtoothWaveData.frames, strokeOpacity: sawtoothWaveData.opacities, strokeWidth: sawtoothWaveData.widths }}
             transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <MotionCircle 
            r="1.2" 
            fill={color}
            initial={{ cx: 0, cy: 35, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
           <MotionCircle 
            r="0.8" 
            fill="white"
            initial={{ cx: 0, cy: 35, opacity: 0 }}
            animate={{ cx: [0, 100], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.25 }}
          />

          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.A}
             animate={{ d: sineWaveData.frames.A, strokeOpacity: sineWaveData.opacities.A }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.B}
             animate={{ d: sineWaveData.frames.B, strokeOpacity: sineWaveData.opacities.B }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <MotionPath
             stroke="url(#stream-fade)"
             strokeWidth="1.2"
             fill="none"
             strokeOpacity={sineWaveData.opacities.C}
             animate={{ d: sineWaveData.frames.C, strokeOpacity: sineWaveData.opacities.C }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
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
  );
});
