import React, { useState } from 'react';
import { Cloud, LineChart, Gauge } from 'lucide-react';
import { WeatherGauge } from '../Weather/WeatherGauge';
import { SensorChart } from '../Analytics/SensorChart';
import { Segment } from '../../types/index';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceState } from '../../hooks/useDevice';

interface Props {
  segment: Segment;
}

const MotionDiv = motion.div as any;

export const WeatherSegment: React.FC<Props> = ({ segment: initialSegment }) => {
  const { data: segment } = useDeviceState(initialSegment.num_of_node);
  const safeSegment = segment || initialSegment;
  const [viewMode, setViewMode] = useState<'gauge' | 'chart'>('gauge');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2">
            <Cloud size={12} /> Environmental Data
        </label>
        <div className="flex bg-secondary/10 rounded-md p-0.5">
            <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 rounded-sm ${viewMode === 'gauge' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('gauge')}
            >
                <Gauge size={14} />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 rounded-sm ${viewMode === 'chart' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('chart')}
            >
                <LineChart size={14} />
            </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'gauge' ? (
            <MotionDiv 
                key="gauges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-4"
            >
                <WeatherGauge value={safeSegment.temperature || 0} min={-10} max={50} unit="°C" label="Temp" color="#daa520" />
                <WeatherGauge value={safeSegment.humidity || 0} min={0} max={100} unit="%" label="Humid" color="#3b82f6" />
            </MotionDiv>
        ) : (
            <MotionDiv
                key="chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <SensorChart segmentId={safeSegment.num_of_node} />
            </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};