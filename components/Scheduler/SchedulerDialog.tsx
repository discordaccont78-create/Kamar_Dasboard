
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CalendarClock } from 'lucide-react';
import { useSettingsStore } from '../../lib/store/settings';
import { Button } from '../ui/button';
import { translations } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { SchedulerBuilder } from './SchedulerBuilder';
import { SchedulerList } from './SchedulerList';

// Wrapper for Radix components to bypass strict type checking if needed
const DialogOverlay = Dialog.Overlay as any;
const DialogContent = Dialog.Content as any;
const DialogClose = Dialog.Close as any;

interface SchedulerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerDialog: React.FC<SchedulerDialogProps> = ({ isOpen, onClose }) => {
  const { settings } = useSettingsStore();
  const t = translations[settings.language];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <DialogOverlay className="DialogOverlay fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
        <DialogContent 
          className={cn(
            "DialogContent fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-background/95 backdrop-blur-2xl border border-primary/20 rounded-3xl z-[200] shadow-2xl flex flex-col focus:outline-none overflow-hidden ring-1 ring-white/5",
            "max-h-[85vh]"
          )}
        >
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-border bg-secondary/5">
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black flex items-center gap-2 text-foreground tracking-tight">
                 <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20">
                    <CalendarClock size={20} strokeWidth={2.5} />
                 </div>
                 {t.scheduler}
              </span>
              <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">{t.scheduler_desc}</span>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-white transition-all rounded-full h-10 w-10">
                <X size={20} />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
             {/* Extracted Builder Logic */}
             <SchedulerBuilder />

             {/* Extracted List Logic */}
             <SchedulerList />
          </div>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
