
import React from 'react';
import { useConnection } from '../../lib/store/connection';
import { Terminal, Trash2 } from 'lucide-react';

export const Console: React.FC = () => {
  const { logs, clearLogs } = useConnection();

  return (
    <div className="mt-8 border-2 border-gray-300 dark:border-[#555] bevel-border bg-white dark:bg-black/40 overflow-hidden shadow-2xl transition-colors duration-300">
      <div className="bg-gray-100 dark:bg-[#111] p-3 flex justify-between items-center border-b border-gray-200 dark:border-[#333]">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Terminal size={14} />
          Protocol Engine Logs
        </div>
        <button 
          onClick={clearLogs}
          className="text-gray-400 hover:text-primary transition-colors"
          title="Clear logs"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="h-48 overflow-y-auto p-3 font-mono text-[10px] space-y-1">
        {logs.length === 0 && <div className="text-gray-400 italic">Listening for binary traffic...</div>}
        {logs.map(log => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={log.direction === 'in' ? 'text-blue-500' : 'text-green-500'}>
              {log.direction === 'in' ? '◀' : '▶'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 select-all font-bold">{log.raw}</span>
            <span className="text-gray-800 dark:text-white">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
