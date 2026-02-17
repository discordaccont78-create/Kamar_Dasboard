
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
      // 1. TIMING
      const isBurst = Math.random() < 0.3;
      const delayBeforeStart = isBurst 
        ? Math.random() * 800 + 300  
        : Math.random() * 3000 + 2000;

      phase1Timeout = setTimeout(() => {
        // 2. GENERATION
        const angle = Math.random() * 360;
        const rawLen = Math.random();
        const length = 120 + (rawLen * rawLen * 480); 

        let thickness = 0.8;
        let branchIntensity = 0.5;
        let lingerDuration = 0.3; 
        let fadeDuration = 0.5;   

        if (length > 300) {
            thickness = 2.5;
            branchIntensity = 1.0 + Math.random(); 
            lingerDuration = 0.5 + Math.random() * 1.0; 
            fadeDuration = 1.5 + Math.random();         
        } else if (length > 200) {
            thickness = 1.5;
            branchIntensity = 0.6 + Math.random() * 0.5;
            lingerDuration = 0.3 + Math.random() * 0.4;
            fadeDuration = 1.0 + Math.random() * 0.5;
        } else {
            thickness = 1.0;
            branchIntensity = Math.random() > 0.4 ? 0.5 : 0; 
            lingerDuration = 0.1 + Math.random() * 0.2;
            fadeDuration = 0.6 + Math.random() * 0.4;
        }

        const travelTime = 0.05 + (length / 2000); 

        // 3. SOUND
        const lenFactor = Math.min((length - 120) / 480, 1); 
        const branchFactor = Math.min(branchIntensity / 2, 1);
        const soundIntensity = (lenFactor * 0.7) + (branchFactor * 0.3);
        
        playLightning(soundIntensity);

        setBoltData({ 
            id: Date.now(), 
            angle, length, thickness, travelTime, branchIntensity, lingerDuration, fadeDuration 
        });
        setIsActive(true);

        const visibleTime = (travelTime * 1000) + 100;
        
        phase2Timeout = setTimeout(() => {
            setIsActive(false);
            const fadeTimeMs = fadeDuration * 1000;
            phase3Timeout = setTimeout(() => {
                setBoltData(null);
                runCycle(); 
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

  const center = 400;
  const rad = (boltData.angle * Math.PI) / 180;
  const startOffset = 45; // Increased slightly for the larger diamond
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
          animationDuration={boltData.travelTime}
          lingerDuration={boltData.fadeDuration}
          className="opacity-90 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]" 
          color="hsl(var(--primary))"
      />
    </div>
  );
});

export const CoreEmblem: React.FC = React.memo(() => {
  // CLIP PATHS for "Tech" Brackets
  // These create segmented rings instead of solid borders
  
  // Outer Bracket: Corners only
  const CLIP_OUTER = "polygon(0 0, 30% 0, 30% 2px, 2px 2px, 2px 30%, 0 30%, 0 100%, 30% 100%, 30% calc(100% - 2px), 2px calc(100% - 2px), 2px 70%, 0 70%, 100% 100%, 70% 100%, 70% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 70%, 100% 70%, 100% 0, 70% 0, 70% 2px, calc(100% - 2px) 2px, calc(100% - 2px) 30%, 100% 30%)";
  
  // Inner Bracket: Side cuts
  const CLIP_INNER = "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"; // Basic Diamond for inner, but we'll use border on a rotated div

  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] md:w-[280px] md:h-[280px]">
      
      {/* 1. Lightning Discharge (Background Layer) */}
      <CoreDischarge />

      {/* 2. Outer Tech Ring (Large Diamond Outline) */}
      <MotionDiv
        animate={{ rotate: [45, 405] }} 
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 md:inset-8 border border-primary/20 bg-transparent z-0"
        style={{ 
            borderRadius: '0px', // SHARP EDGES
            // Using a simpler dashed border on a rotated square for the "Radar" look
            borderStyle: 'dashed',
            borderWidth: '1px'
        }}
      />

      {/* 3. Middle Tech Ring (Segmented) */}
      <MotionDiv
        animate={{ rotate: [45, -315] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute inset-12 md:inset-20 border-2 border-white/10 z-0"
        style={{ 
            borderRadius: '0px' // SHARP EDGES
        }}
      >
          {/* Decorative Corners using absolute divs to simulate tech brackets */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary/40" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary/40" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary/40" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary/40" />
      </MotionDiv>

      {/* 4. THE CORE (Solid Diamond Background) */}
      {/* 
          We separate the Background from the Content.
          The Background is rotated 45deg to make the Diamond.
          The Content (Icon) sits on top, NOT rotated, so it stays upright.
      */}
      <MotionDiv
        animate={{ 
          scale: [1, 1.02, 1],
          boxShadow: [
            '0 0 20px -5px rgba(var(--primary), 0.3)',
            '0 0 40px -5px rgba(var(--primary), 0.6)',
            '0 0 20px -5px rgba(var(--primary), 0.3)'
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-24 h-24 md:w-32 md:h-32 bg-background/90 backdrop-blur-xl border border-primary z-10"
        style={{ 
            rotate: '45deg', // Fixed Diamond Rotation
            borderRadius: '0px' // SHARP EDGES - Force Square corners
        }}
      >
          {/* Inner decorative border inside the diamond */}
          <div className="absolute inset-1 border border-primary/20" />
      </MotionDiv>

      {/* 5. THE ICON (Floating Upright) */}
      <div className="relative z-20 flex items-center justify-center">
          <MotionDiv
            animate={{ 
                filter: [
                    'drop-shadow(0 0 0px rgba(var(--primary),0))',
                    'drop-shadow(0 0 15px rgba(var(--primary),0.8))',
                    'drop-shadow(0 0 0px rgba(var(--primary),0))'
                ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap 
                className="text-primary w-12 h-12 md:w-16 md:h-16 fill-current" 
                strokeWidth={0} 
            />
          </MotionDiv>
      </div>

    </div>
  );
});
