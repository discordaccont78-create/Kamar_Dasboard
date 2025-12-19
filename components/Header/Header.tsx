
import React from 'react';
import { Moon, Sun, Settings, Zap, Terminal } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="bg-black text-white px-8 py-6 rounded-b-[40px] border-b-4 border-primary shadow-2xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-2xl shadow-[0_0_20px_rgba(218,165,32,0.4)]">
            <Zap size={24} fill="black" stroke="black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-primary">
              {settings.title}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
              <Terminal size={10} /> 
              V3.1 Node Controller
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-110 active:scale-95 border border-white/5"
            title="Switch Logic Environment"
          >
            {settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={onOpenMenu}
            className="p-3 rounded-2xl bg-primary text-black transition-all hover:scale-110 active:scale-95 shadow-lg border border-white/20"
            title="System Configuration"
          >
            <Settings size={20} />
          </button>
          
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </header>
  );
};
