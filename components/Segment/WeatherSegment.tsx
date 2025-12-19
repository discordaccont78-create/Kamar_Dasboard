
import React from 'react';
import { Cloud } from 'lucide-react';
import { WeatherGauge } from '../Weather/WeatherGauge';
// Fixed: Explicit path to types index
import { Segment } from '../../types/index';

interface Props {
  segment: Segment;
}

export const WeatherSegment: React.FC<Props> = ({ segment }) => {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Cloud size={12} /> Environmental Data</label>
      <div className="grid grid-cols-2 gap-4">
        <WeatherGauge value={segment.temperature || 0} min={-10} max={50} unit="°C" label="Temp" color="#daa520" />
        <WeatherGauge value={segment.humidity || 0} min={0} max={100} unit="%" label="Humid" color="#3b82f6" />
      </div>
    </div>
  );
};
