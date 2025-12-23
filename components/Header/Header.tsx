
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings, Zap, Terminal, Globe, CalendarClock } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useSettingsStore } from '../../lib/store/settings';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [time, setTime] = useState<string>('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  const t = translations[settings.language];

  useEffect(() => {
    // Initial set
    const locale = settings.language === 'fa' ? 'fa-IR' : 'en-US';
    setTime(new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'en' ? 'fa' : 'en' });
  };

  return (
    <header className="sticky top-2 md:top-4 z-50 px-2 md:px-6 transition-all duration-500">
      <div className="bg-card/85 backdrop-blur-xl backdrop-saturate-150 text-foreground px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl mx-auto flex items-center justify-between relative max-w-7xl">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3 md:gap-4 z-10">
          <div className="bg-card/50 border border-primary/20 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-sm backdrop-blur-md transition-all duration-300">
            <Zap className="text-primary w-4 h-4 md:w-6 md:h-6" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h1 className={cn(
              "text-lg md:text-2xl font-black uppercase tracking-tighter leading-none transition-all truncate max-w-[120px] md:max-w-none",
              settings.animations ? "text-shimmer" : "text-primary"
            )}>
              {settings.title}
            </h1>
            <div className="hidden md:flex items-center gap-2 mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              <Terminal size={10} /> 
              {t.node_controller}
            </div>
          </div>
        </div>
        
        {/* Center: Clock - Hidden on Mobile */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-center opacity-80">
            <div className={cn(
                "clock-display font-mono text-xl font-black tracking-widest flex items-center gap-2",
                settings.animations ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-foreground"
            )}>
               {time || "00:00:00"}
            </div>
            <div className="text-[8px] uppercase tracking-[0.4em] text-muted-foreground mt-1">{t.system_time}</div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-3 z-10">
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSchedulerOpen(true)}
            title={t.scheduler}
            className="rounded-lg md:rounded-xl h-9 w-9 md:h-12 md:w-12 hover:bg-primary/10 hover:border-primary/50 text-primary border-primary/30"
          >
             <CalendarClock className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={t.switch_env}
            className="rounded-lg md:rounded-xl h-9 w-9 md:h-12 md:w-12 hover:bg-primary/10 hover:border-primary/50"
          >
            {settings.theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleLanguage}
            title={t.switch_lang}
            className="rounded-lg md:rounded-xl h-9 w-9 md:h-12 md:w-12 hover:bg-primary/10 hover:border-primary/50 font-black text-[10px] md:text-xs"
          >
            {settings.language === 'en' ? 'FA' : 'EN'}
          </Button>
          
          <Button 
            onClick={onOpenMenu}
            size="icon"
            className="rounded-lg md:rounded-xl h-9 w-9 md:h-12 md:w-12 shadow-lg hover:brightness-110"
            title={t.sys_config}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>
        </div>
      </div>
      
      <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </header>
  );
};
