
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '../../lib/store/connection';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useConnection();

  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all shadow-lg ${
      isConnected ? 'bg-black text-green-500 border-green-500/50' : 'bg-black text-red-500 border-red-500/50'
    }`}>
      {isConnected ? <Wifi size={16} className="animate-pulse" /> : <WifiOff size={16} />}
      <span className="font-black text-[11px] uppercase tracking-widest">
        {isConnected ? `Online` : 'Offline'}
      </span>
    </div>
  );
};
