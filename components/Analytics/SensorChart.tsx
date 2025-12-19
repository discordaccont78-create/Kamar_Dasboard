
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '../ui/card';
import { useAnalytics } from '../../lib/store/analytics';

interface Props {
  segmentId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-2 rounded-lg shadow-xl text-xs font-mono">
        <p className="font-bold text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
           <div key={index} style={{ color: entry.color }} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-bold">{entry.name}: {entry.value}</span>
           </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SensorChart: React.FC<Props> = ({ segmentId }) => {
  const { sensorHistory } = useAnalytics();
  const data = sensorHistory[segmentId] || { temp: [], hum: [] };
  
  // Merge temp and hum data by index if possible, or just map one. 
  // For simplicity, we assume they come in roughly at same time, 
  // but to be safe let's just use the temp array length as base if available.
  
  const chartData = data.temp.map((t, i) => ({
    time: t.time,
    Temp: t.value,
    Humidity: data.hum[i]?.value || 0
  }));

  if (chartData.length < 2) {
    return (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-[10px] font-mono uppercase tracking-widest bg-secondary/5 rounded-xl border border-dashed border-border">
            Waiting for more data points...
        </div>
    );
  }

  return (
    <div className="h-[200px] w-full mt-4 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#daa520" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#daa520" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
          <XAxis 
            dataKey="time" 
            hide 
            interval="preserveStartEnd"
          />
          <YAxis 
            hide 
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="Temp" 
            stroke="#daa520" 
            fillOpacity={1} 
            fill="url(#colorTemp)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="Humidity" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorHum)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
