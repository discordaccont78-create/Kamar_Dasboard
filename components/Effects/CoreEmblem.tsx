
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useSoundFx } from '../../hooks/useSoundFx';
import { LightningBolt } from './LightningBolt';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

// --- CORE EMBLEM: SPORADIC DISCHARGE ---
const CoreDischarge = React.memo(() => {
  const [boltData, setBoltData] = useState<{ 
      id: number; 
      angle: number; 
      length: number; 
      thickness: number; 
      travelTime: number; 
      branchIntensity: number; 
      lingerDuration: number;
      fadeDuration: number; 
  } | null>(null);

  const [isActive, setIsActive] = useState(false);
  const { playLightning } = useSoundFx();

  useEffect(() => {
    let phase1Timeout: ReturnType<typeof setTimeout>;
    let phase2Timeout: ReturnType<typeof setTimeout>;
    let phase3Timeout: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      // 1. TIMING: Determine Delay before next bolt
      const isBurst = Math.random() < 0.3;
      const delayBeforeStart = isBurst 
        ? Math.random() * 800 + 300  
        : Math.random() * 3000 + 2000;

      phase1Timeout = setTimeout(() => {
        // 2. GENERATION: Create Bolt Data
        const angle = Math.random() * 360;
        const rawLen = Math.random();
        const length = 120 + (rawLen * rawLen * 480); 

        let thickness = 0.8;
        let branchIntensity = 0.5; // Default some branching
        let lingerDuration = 0.3; 
        let fadeDuration = 0.5;   

        if (length > 300) {
            // Big Bolt: Heavy, recursive branches, long linger
            thickness = 2.5;
            branchIntensity = 1.0 + Math.random(); // High intensity = more recursive depth
            lingerDuration = 0.5 + Math.random() * 1.0; 
            fadeDuration = 1.5 + Math.random();         
        } else if (length > 200) {
            // Medium Bolt
            thickness = 1.5;
            branchIntensity = 0.6 + Math.random() * 0.5;
            lingerDuration = 0.3 + Math.random() * 0.4;
            fadeDuration = 1.0 + Math.random() * 0.5;
        } else {
            // Small Bolt
            thickness = 1.0;
            branchIntensity = Math.random() > 0.4 ? 0.5 : 0; 
            lingerDuration = 0.1 + Math.random() * 0.2;
            fadeDuration = 0.6 + Math.random() * 0.4;
        }

        // STRIKE SPEED: Extremely fast (Flash)
        const travelTime = 0.05 + (length / 2000); 

        // 3. SOUND CALCULATION
        // Normalize length (approx 120 to 600) to 0-1 range
        const lenFactor = Math.min((length - 120) / 480, 1); 
        // Normalize branches (0 to ~2)
        const branchFactor = Math.min(branchIntensity / 2, 1);
        
        // Intensity is weighted average: Length matters more (70%), Branches (30%)
        const soundIntensity = (lenFactor * 0.7) + (branchFactor * 0.3);
        
        // Trigger Sound
        playLightning(soundIntensity);

        setBoltData({ 
            id: Date.now(), 
            angle, length, thickness, travelTime, branchIntensity, lingerDuration, fadeDuration 
        });
        setIsActive(true);

        // Keep it visible for Strike Time + a tiny bit of hold, then fade
        const visibleTime = (travelTime * 1000) + 100;
        
        phase2Timeout = setTimeout(() => {
            setIsActive(false);

            const fadeTimeMs = fadeDuration * 1000;
            phase3Timeout = setTimeout(() => {
                setBoltData(null);
                runCycle(); // Loop
            }, fadeTimeMs + 100); 

        }, visibleTime);

      }, delayBeforeStart);
    };

    runCycle();

    return () => {
      clearTimeout(phase1Timeout);
      clearTimeout(phase2Timeout);
      clearTimeout(phase3Timeout);
    };
  }, [playLightning]);

  if (!boltData) return <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-0" />;

  // Coordinate System
  const center = 400;
  const rad = (boltData.angle * Math.PI) / 180;
  const startOffset = 35; 
  const sx = center + startOffset * Math.cos(rad);
  const sy = center + startOffset * Math.sin(rad);
  const ex = center + boltData.length * Math.cos(rad);
  const ey = center + boltData.length * Math.sin(rad);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-0 overflow-visible">
      <LightningBolt 
          key={boltData.id} 
          active={isActive} 
          startX={sx} startY={sy} 
          endX={ex} endY={ey}
          viewBox="0 0 800 800"
          segments={12 + Math.floor(boltData.length / 25)} 
          amplitude={10 + Math.random() * 20} 
          glowIntensity={3}
          thickness={boltData.thickness} 
          branchIntensity={boltData.branchIntensity} 
          animationDuration={boltData.travelTime} // This is now very short (Strike)
          lingerDuration={boltData.fadeDuration} // This is now long (Fade)
          className="opacity-90 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]" 
          color="hsl(var(--primary))"
      />
    </div>
  );
});

export const CoreEmblem: React.FC = React.memo(() => (
  <div className="relative flex items-center justify-center w-[200px] h-[200px] md:w-[280px] md:h-[280px]">
    
    {/* 1. The Discharge Effect (Behind the Core but allowed to overflow) */}
    <CoreDischarge />

    {/* 2. Outer Containment Ring (Subtle rotation) */}
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 opacity-10 border border-dashed border-primary rounded-full"
    />
    
    <MotionDiv
      animate={{ rotate: -360 }}
      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      className="absolute inset-4 opacity-5 border border-dotted border-white rounded-full"
    />

    {/* 3. The Core Source (Zap Icon) */}
    <MotionDiv
      animate={{ 
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 10px rgba(var(--primary),0.2))',
          'drop-shadow(0 0 20px rgba(var(--primary),0.5))', 
          'drop-shadow(0 0 10px rgba(var(--primary),0.2))'
        ]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="z-10 relative flex items-center justify-center bg-background/80 backdrop-blur-md rounded-full p-6 border border-primary/20 shadow-2xl"
    >
      <Zap className="text-primary w-12 h-12 md:w-20 md:h-20 fill-current" strokeWidth={0} />
    </MotionDiv>
  </div>
));
