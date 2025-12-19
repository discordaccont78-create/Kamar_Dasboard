
import React from 'react';
import { useConnection } from '../../lib/store/connection';
import { Terminal, Trash2, X, Activity } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ConsoleProps {
  onClose?: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ onClose }) => {
  const { logs, clearLogs } = useConnection();

  return (
    <Card className="border-t-4 border-t-primary rounded-xl overflow-hidden shadow-2xl bg-card dark:bg-[#0c0c0e] border-x-border border-b-border">
      <div className="bg-muted/30 p-3 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
          <Terminal size={14} />
          Protocol Engine
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearLogs}
            className="h-6 px-2 text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
          {onClose && (
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 font-mono text-[10px] space-y-2 no-scrollbar bg-black/5 dark:bg-black/20">
        {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2">
                <Activity size={24} className="opacity-20" />
                <span className="italic font-bold uppercase tracking-widest text-[9px]">Awaiting Protocol Packets</span>
            </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 border-b border-border/40 pb-1.5 last:border-0 hover:bg-muted/20 transition-colors p-1 rounded-sm">
            <span className="text-muted-foreground font-bold opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
            <span className={cn("font-black min-w-[30px]", log.direction === 'in' ? 'text-blue-500' : 'text-primary')}>
              {log.direction === 'in' ? 'RX' : 'TX'}
            </span>
            <span className="text-muted-foreground/80 select-all font-bold bg-muted/30 px-1.5 rounded tracking-wider">{log.raw}</span>
            <span className="text-foreground/80 flex-1 truncate font-medium">{log.msg}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
