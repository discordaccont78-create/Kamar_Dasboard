
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

  // Now following the theme instead of being inverted
  return (
    <header className="bg-card-light dark:bg-card-dark text-[#1A1C1E] dark:text-[#E0E0E0] px-8 py-6 rounded-b-[40px] border-b-4 border-primary shadow-2xl sticky top-0 z-50 transition-all duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-2xl shadow-[0_0_20px_rgba(218,165,32,0.4)]">
            <Zap size={24} fill="currentColor" stroke="currentColor" className="text-white dark:text-[#1A1C1E]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-primary">
              Kamyar Pro IoT
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
              <Terminal size={10} /> 
              V3.1 Node Controller
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/10 dark:border-white/10"
            title="Switch Environment"
          >
            {settings.theme === 'light' ? <Moon size={20} className="text-[#1A1C1E]" /> : <Sun size={20} className="text-primary" />}
          </button>
          
          <button 
            onClick={onOpenMenu}
            className="p-3 rounded-2xl bg-primary text-[#1A1C1E] transition-all hover:scale-110 active:scale-95 shadow-lg border border-black/10"
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
