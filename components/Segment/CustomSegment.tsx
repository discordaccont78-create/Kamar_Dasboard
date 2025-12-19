
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power } from 'lucide-react';
import { Slider } from '../UI/Slider';
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
  onToggle: () => void;
  onPWMChange: (val: number) => void;
}

export const CustomSegment: React.FC<Props> = ({ segment, onToggle, onPWMChange }) => {
  const isOn = segment.is_led_on === 'on';

  return (
    <>
      <AnimatePresence mode="wait">
        {(segment.segType === 'All' || segment.segType === 'Digital') && (
          <motion.button 
            layout
            onClick={onToggle} 
            animate={{ 
              backgroundColor: isOn ? '#daa520' : 'rgba(156, 163, 175, 0.1)',
              color: isOn ? '#000' : 'rgba(156, 163, 175, 0.5)'
            }}
            className={`w-full py-6 font-black text-2xl tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 shadow-inner ${
              isOn ? 'shadow-[0_0_20px_rgba(218,165,32,0.3)]' : ''
            }`}
          >
            <Power size={24} />{isOn ? 'ON' : 'OFF'}
          </motion.button>
        )}
      </AnimatePresence>

      {(segment.segType === 'All' || segment.segType === 'PWM') && (
        <Slider 
          label="PWM Logic Signal"
          value={segment.val_of_slide} 
          onChange={onPWMChange} 
        />
      )}
    </>
  );
};
