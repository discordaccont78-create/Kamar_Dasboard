
import React from 'react';
import { Moon, Sun, Settings, Zap, Terminal } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';
import { Button } from '../ui/button';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="bg-card/80 backdrop-blur-md text-foreground px-8 py-6 rounded-b-[32px] border-b border-border shadow-sm sticky top-0 z-50 transition-all duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
            <Zap size={24} fill="currentColor" stroke="currentColor" className="text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-primary">
              Kamyar Pro IoT
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              <Terminal size={10} /> 
              V3.1 Node Controller
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title="Switch Environment"
            className="rounded-xl h-12 w-12"
          >
            {settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          
          <Button 
            onClick={onOpenMenu}
            size="icon"
            className="rounded-xl h-12 w-12 shadow-lg"
            title="System Configuration"
          >
            <Settings size={20} />
          </Button>
          
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </header>
  );
};
