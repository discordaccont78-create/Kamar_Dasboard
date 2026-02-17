
import React, { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { useUIStore } from '../../lib/store/uiState';
import { Settings as SettingsIcon, X, CalendarClock, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { useSoundFx } from '../../hooks/useSoundFx';

// Import New Sections
import { OutputSection } from './SideMenuParts/OutputSection';
import { InputSection } from './SideMenuParts/InputSection';
import { RegisterSection } from './SideMenuParts/RegisterSection';
import { WeatherSection } from './SideMenuParts/WeatherSection';
import { DisplaySection } from './SideMenuParts/DisplaySection';
import { SystemCoreSection } from './SideMenuParts/SystemCoreSection';
import { SchedulerDialog } from '../Scheduler/SchedulerDialog';

const DialogOverlay = Dialog.Overlay as any;
const DialogContent = Dialog.Content as any;
const DialogTitle = Dialog.Title as any;
const DialogClose = Dialog.Close as any;

interface SideMenuProps { isOpen: boolean; onClose: () => void; }

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { segments } = useSegments();
  const { activeSection, setActiveSection } = useUIStore();
  const { playToggle, playClick } = useSoundFx();
  
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const t = translations[settings.language];

  const handleSectionToggle = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const handleToggleTheme = () => {
      playToggle(settings.theme === 'light');
      updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleToggleLanguage = () => {
      playToggle(settings.language === 'en');
      updateSettings({ language: settings.language === 'en' ? 'fa' : 'en' });
  };

  const handleOpenScheduler = () => {
      playClick();
      setIsSchedulerOpen(true);
  };

  const uniqueGroups = useMemo<string[]>(() => {
    const groups = new Set(segments.map(s => s.groupId).filter((g): g is string => !!g));
    return Array.from(groups).sort() as string[];
  }, [segments]);

  const uniqueNames = useMemo<string[]>(() => {
    const names = new Set(segments.map(s => s.name).filter((n): n is string => !!n));
    return Array.from(names).sort() as string[];
  }, [segments]);

  // Logic to switch to square-matrix if font is ProggyDotted
  const headerBgClass = (() => {
    if (settings.backgroundEffect === 'dots') return 'dot-matrix pattern-bg';
    if (settings.backgroundEffect === 'squares') return 'pattern-bg';
    if (settings.backgroundEffect === 'triangles') return 'pattern-bg';
    return 'graph-paper';
  })();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <DialogOverlay className="DialogOverlay fixed inset-0 bg-background/50 backdrop-blur-sm z-[150]" />
        
        <DialogContent 
          className={cn(
            "DialogContent fixed top-4 bottom-4 w-full max-w-[420px] bg-background dark:bg-card/95 backdrop-blur-2xl border border-border rounded-3xl z-[200] shadow-2xl flex flex-col focus:outline-none overflow-hidden ring-1 ring-border/20",
            settings.language === 'fa' ? 'left-4' : 'right-4'
          )}
        >
          <div className="relative overflow-hidden shrink-0 border-b border-border">
             <div className={cn("absolute inset-0 opacity-10", headerBgClass, settings.animations && "animate-grid")} />
             
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/90" />

             <div className="relative z-10 p-6 flex justify-between items-center">
                <DialogTitle className="flex flex-col gap-1">
                <span className="text-xl font-black flex items-center gap-2 text-foreground tracking-tight">
                    <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20">
                        <SettingsIcon size={18} strokeWidth={3} />
                    </div>
                    {t.sys_config}
                </span>
                <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-60 pl-1">{t.control_panel}</span>
                </DialogTitle>
                <DialogClose asChild>
                <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-white transition-all rounded-full h-10 w-10">
                    <X size={20} />
                </Button>
                </DialogClose>
             </div>
          </div>

          <datalist id="group-suggestions">
            {uniqueGroups.map(g => <option key={g} value={g} />)}
          </datalist>
          <datalist id="name-suggestions">
            {uniqueNames.map(n => <option key={n} value={n} />)}
          </datalist>

          {/* FIX: Removed 'no-scrollbar' class to allow custom scrollbar to be seen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            
            {/* Quick Actions (Moved from Mobile Header) */}
            <div className="grid grid-cols-3 gap-2 mb-2 md:hidden">
                <QuickActionButton 
                    onClick={handleOpenScheduler} 
                    icon={CalendarClock} 
                    label={t.scheduler} 
                    active={isSchedulerOpen}
                />
                <QuickActionButton 
                    onClick={handleToggleTheme} 
                    icon={settings.theme === 'light' ? Moon : Sun} 
                    label={t.switch_env} 
                />
                <QuickActionButton 
                    onClick={handleToggleLanguage} 
                    icon={Globe} 
                    label={settings.language === 'en' ? 'FA' : 'EN'} 
                />
            </div>

            <OutputSection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            <InputSection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            <RegisterSection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            <WeatherSection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            <DisplaySection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            <SystemCoreSection activeId={activeSection} onToggle={handleSectionToggle} t={t} />
            
          </div>
        </DialogContent>
      </Dialog.Portal>
      
      {/* Mobile Scheduler Dialog attached to Menu Portal */}
      <SchedulerDialog isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </Dialog.Root>
  );
};

const QuickActionButton = ({ onClick, icon: Icon, label, active }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all active:scale-95 h-16",
            active 
                ? "bg-primary/20 border-primary text-primary" 
                : "bg-secondary/10 border-border/50 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
        )}
    >
        <Icon size={18} strokeWidth={2.5} />
        <span className="text-[8px] font-black uppercase tracking-wider truncate max-w-full">{label}</span>
    </button>
);
