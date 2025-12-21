
import React from 'react';
import { getIconForName } from '../../lib/iconMapper';

interface GroupHeaderProps {
  name: string;
  count: number;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({ name, count }) => {
  // Dynamically get icon based on group name
  const Icon = getIconForName(name, 'group');

  return (
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl text-primary shadow-sm border border-primary/10">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white">
          {name}
        </h3>
      </div>
      <span className="bg-gray-200 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/5">
        {count} {count === 1 ? 'Node' : 'Nodes'}
      </span>
    </div>
  );
};
