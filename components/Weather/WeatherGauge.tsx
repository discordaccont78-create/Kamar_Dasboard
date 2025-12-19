
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WeatherGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  color?: string;
}

// Fix: Casting motion.circle to any to resolve intrinsic property type errors (initial, animate)
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
    <div className="bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center shadow-inner group transition-all">
      <div className="w-full text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 flex justify-between">
        <span>{label}</span>
        <span className="text-primary">{displayValue.toFixed(1)}{unit}</span>
      </div>
      
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeDasharray={`${circumference * gaugeAngle} ${circumference}`}
            className="text-gray-100 dark:text-[#1a1a1a]"
          />
          <MotionCircle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', damping: 12, stiffness: 50 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-2">
          <span className="text-xl font-black text-black dark:text-white">
            {displayValue.toFixed(0)}
          </span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};
