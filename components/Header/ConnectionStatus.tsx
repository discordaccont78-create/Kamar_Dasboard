
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '../../lib/store/connection';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useConnection();

  return (
    <div 
      className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all shadow-lg ${
        isConnected 
          ? 'bg-black dark:bg-white text-primary border-primary/50' 
          : 'bg-black dark:bg-white text-red-500 border-red-500/50'
      }`}
      title={isConnected ? 'System Synced' : 'System Offline'}
    >
      {isConnected ? (
        <Wifi size={20} className="animate-pulse" />
      ) : (
        <WifiOff size={20} />
      )}
    </div>
  );
};
