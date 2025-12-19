
import React, { useState, useEffect } from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, min = 0, max = 255, onChange, label }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
  };

  const handleCommit = () => {
    onChange(localValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center px-1">
        {label && (
          <label className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="bg-black text-primary border border-primary/20 px-2 py-0.5 rounded-chip text-[9px] font-black shadow-sm">
          {localValue}
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="relative z-10 w-full appearance-none bg-transparent cursor-pointer h-full"
          style={{
            // Overriding base height/style for more compact look
          }}
        />
      </div>
    </div>
  );
};
