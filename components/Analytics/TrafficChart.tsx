
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAnalytics } from '../../lib/store/analytics';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-2 rounded-lg shadow-xl text-[10px] font-mono">
        <div className="font-bold text-muted-foreground mb-1">{label}</div>
        <div className="flex gap-4">
             <div className="text-primary">TX: {payload[0].value}</div>
             <div className="text-blue-500">RX: {payload[1].value}</div>
        </div>
      </div>
    );
  }
  return null;
};

export const TrafficChart: React.FC = () => {
  const { trafficHistory } = useAnalytics();

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trafficHistory}>
          <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
          <XAxis dataKey="time" hide />
          <Bar dataKey="tx" fill="#daa520" radius={[2, 2, 0, 0]} stackId="a" animationDuration={500} />
          <Bar dataKey="rx" fill="#3b82f6" radius={[2, 2, 0, 0]} stackId="a" animationDuration={500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
