import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Send, Trash2, Clock } from 'lucide-react';
// Fix: Import from ../UI/Slider to maintain consistency with the component's perceived file path in the program.
import { Slider } from '../UI/Slider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Segment, CMD } from '../../types/index';
import { useDeviceState, useDeviceControl } from '../../hooks/useDevice';

interface Props {
  segment: Segment;
  onToggle?: () => void; // Deprecated prop, kept for compatibility if needed
  onPWMChange?: (val: number) => void; // Deprecated prop
}

const MotionDiv = motion.div as any;

export const CustomSegment: React.FC<Props> = ({ segment: initialSegment }) => {
  // Use React Query for state
  const { data: segment } = useDeviceState(initialSegment.num_of_node);
  const { mutate: controlDevice } = useDeviceControl();
  
  const safeSegment = segment || initialSegment;
  const isOn = safeSegment.is_led_on === 'on';
  const [code, setCode] = useState("");

  const handleToggle = () => {
    const cmd = isOn ? CMD.LED_OFF : CMD.LED_ON;
    controlDevice({ 
        cmd, 
        gpio: safeSegment.gpio || 0, 
        value: 0, 
        nodeId: safeSegment.num_of_node 
    });
  };

  const handlePWM = (val: number) => {
     controlDevice({ 
        cmd: CMD.LED_PWM, 
        gpio: safeSegment.gpio || 0, 
        value: val, 
        nodeId: safeSegment.num_of_node 
     });
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6"
    >
      {/* Power Control */}
      {(safeSegment.segType === 'All' || safeSegment.segType === 'Digital') && (
        <div className="flex items-center justify-between bg-secondary/5 p-3 rounded-lg border border-border-light dark:border-border-dark">
           <div className="flex flex-col">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Relay Logic</label>
              <span className="text-xs font-mono font-bold">{isOn ? 'ACTIVE' : 'IDLE'}</span>
           </div>
           <Switch checked={isOn} onCheckedChange={handleToggle} />
        </div>
      )}

      {/* Proportional Control */}
      {(safeSegment.segType === 'All' || safeSegment.segType === 'PWM') && (
        <div className="bg-secondary/5 p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PWM Intensity</label>
             <span className="font-mono text-xs font-bold text-primary">{safeSegment.val_of_slide}</span>
          </div>
          <Slider
            value={[safeSegment.val_of_slide]}
            onValueChange={(vals) => handlePWM(vals[0])}
            max={255}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Code Injection Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-1">Protocol Injector</label>
        <div className="flex gap-2 items-center">
          <Input 
            type="text" 
            placeholder="Command Hex..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-9 text-xs"
          />
          <Button size="sm" className="h-9 px-3">
            <Send size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setCode("")}
            className="h-9 px-3 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Timer Section */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-muted-foreground">
           <Clock size={12} />
           <span className="text-[9px] font-black uppercase tracking-widest">Runtime</span>
        </div>
        <div className="flex gap-1 font-mono text-[10px] font-black dark:text-white">
          <span className="bg-secondary/10 px-1 py-0.5 rounded">00</span>:
          <span className="bg-secondary/10 px-1 py-0.5 rounded text-primary">00</span>:
          <span className="bg-secondary/10 px-1 py-0.5 rounded">00</span>
        </div>
      </div>
    </MotionDiv>
  );
};
