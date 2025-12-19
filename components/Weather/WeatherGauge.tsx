
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

export const WeatherGauge: React.FC<WeatherGaugeProps> = ({ value, min, max, unit, label, color = "#daa520" }) => {
  const [displayValue, setDisplayValue] = useState(min);

  useEffect(() => {
    setDisplayValue(value || 0);
  }, [value]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(Math.max(displayValue, min), max);
  const normalizedValue = (safeValue - min) / (max - min);
  const offset = circumference - normalizedValue * (circumference * 0.75); // 75% gauge

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-black/20 rounded-[24px] border border-gray-200 dark:border-white/5 shadow-inner group transition-all">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-[225deg]" viewBox="0 0 200 200">
          {/* Background Path */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            className="text-gray-200 dark:text-[#222]"
          />
          {/* Foreground Path */}
          <motion.circle
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
            transition={{ type: 'spring', damping: 15, stiffness: 60 }}
            style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-2">
          <span className="text-2xl font-black text-black dark:text-white leading-none">
            {displayValue.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
            {unit}
          </span>
        </div>
      </div>
      <span className="mt-2 text-[9px] font-black text-primary uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
};
