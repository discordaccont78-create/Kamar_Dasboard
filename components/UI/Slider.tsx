
import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, min = 0, max = 255, onChange, label }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-center px-1">
        {label && <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</label>}
        <div className="px-3 py-1 bg-black border border-[#daa520]/40 rounded-lg text-[10px] text-[#daa520] font-black shadow-inner">
          {value}
        </div>
      </div>
      <div className="flex items-center group">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 appearance-none bg-black/40 h-3 rounded-full cursor-pointer outline-none transition-all shadow-inner border border-white/5"
          style={{
            background: `linear-gradient(to right, #daa520 0%, #daa520 ${percentage}%, #222 ${percentage}%, #222 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-gray-700 uppercase px-1">
        <span>MIN</span>
        <span>MAX</span>
      </div>
    </div>
  );
};
