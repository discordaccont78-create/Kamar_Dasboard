
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '../../lib/store/connection';
import { cn } from '../../lib/utils';

export const ConnectionStatus: React.FC = () => {
  const { isConnected } = useConnection();

  return (
    <div 
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all shadow-md",
        isConnected 
          ? 'bg-background text-primary border-primary/50' 
          : 'bg-background text-destructive border-destructive/50'
      )}
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
