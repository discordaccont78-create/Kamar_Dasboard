
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface WeatherGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  color?: string;
}

const MotionCircle = motion.circle as any;

export const WeatherGauge: React.FC<WeatherGaugeProps> = ({ value, min, max, unit, label, color = "#daa520" }) => {
  const [displayValue, setDisplayValue] = useState(min);

  useEffect(() => {
    setDisplayValue(value || 0);
  }, [value]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(Math.max(displayValue, min), max);
  const normalizedValue = (safeValue - min) / (max - min);
  const gaugeAngle = 0.75; // 270 degrees
  const offset = circumference - normalizedValue * (circumference * gaugeAngle);

  return (
    <div className="bg-secondary/10 border border-border rounded-xl p-4 flex flex-col items-center shadow-sm relative overflow-hidden group">
      <div className="w-full text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 flex justify-between z-10">
        <span>{label}</span>
        <span className="text-primary font-mono">{displayValue.toFixed(1)}{unit}</span>
      </div>
      
      <div className="relative w-28 h-28 z-10">
        <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 200 200">
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={`${circumference * gaugeAngle} ${circumference}`}
            className="text-muted/30"
          />
          {/* Active Value Indicator */}
          <MotionCircle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', damping: 12, stiffness: 50 }}
            className="drop-shadow-sm"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-2">
          <span className="text-xl font-black text-foreground tracking-tight">
            {displayValue.toFixed(0)}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
            {unit}
          </span>
        </div>
      </div>

      {/* Subtle Background Highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 dark:to-white/5 pointer-events-none" />
    </div>
  );
};
