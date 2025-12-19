
import React from 'react';
import { Layers } from 'lucide-react';

interface GroupHeaderProps {
  name: string;
  count: number;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ name, count }) => {
  return (
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl text-primary">
          <Layers size={18} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white">
          {name}
        </h3>
      </div>
      <span className="bg-gray-200 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
        {count} {count === 1 ? 'Node' : 'Nodes'}
      </span>
    </div>
  );
};
