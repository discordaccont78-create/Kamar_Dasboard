
import React from 'react';
import { useConnection } from '../../lib/store/connection';
import { Terminal, Trash2, X } from 'lucide-react';

interface ConsoleProps {
  onClose?: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ onClose }) => {
  const { logs, clearLogs } = useConnection();

  return (
    <div className="border-t-4 border-primary bg-black/95 backdrop-blur-md overflow-hidden shadow-2xl transition-colors duration-300">
      <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
          <Terminal size={16} />
          Protocol Engine Logs
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearLogs}
            className="text-white/40 hover:text-primary transition-colors flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
          >
            <Trash2 size={14} /> Clear
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 font-mono text-[11px] space-y-2 no-scrollbar">
        {logs.length === 0 && <div className="text-white/20 italic font-black uppercase tracking-[0.2em] py-8 text-center">No binary traffic detected on interface</div>}
        {logs.map(log => (
          <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 transition-colors">
            <span className="text-white/30 font-black">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={`font-black ${log.direction === 'in' ? 'text-blue-400' : 'text-primary'}`}>
              {log.direction === 'in' ? 'RECV' : 'SEND'}
            </span>
            <span className="text-white/50 select-all font-black bg-white/5 px-2 rounded tracking-widest">{log.raw}</span>
            <span className="text-white/80 flex-1">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
