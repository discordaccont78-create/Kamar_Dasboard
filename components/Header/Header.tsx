
import React from 'react';
import { LayoutDashboard, Settings } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings } = useSettingsStore();

  return (
    <header className="bg-primary border-b-[10px] border-gray-300 dark:border-[#444] rounded-b-[42px] p-8 shadow-2xl mb-12 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 group">
           <div className="bg-black text-primary p-3 rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform">
              <LayoutDashboard size={28} />
           </div>
           <div>
              <h1 className="text-black font-black text-3xl uppercase tracking-tighter leading-tight">
                {settings.title}
              </h1>
              <p className="text-black/50 text-[10px] font-bold uppercase tracking-[0.3em]">Next-Gen IoT Node Controller</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenMenu} 
            className="bg-black text-primary p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl border border-white/5"
          >
            <Settings size={22} />
          </button>
          <ConnectionStatus />
        </div>
      </div>
    </header>
  );
};
