
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, Power, Plus, Trash2, Clock, Check, ArrowRight } from 'lucide-react';
import { useSegments } from '../../lib/store/segments';
import { useSchedulerStore } from '../../lib/store/scheduler';
import { useSettingsStore } from '../../lib/store/settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { translations } from '../../lib/i18n';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div as any;

interface SchedulerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerDialog: React.FC<SchedulerDialogProps> = ({ isOpen, onClose }) => {
  const { segments } = useSegments();
  const { schedules, addSchedule, removeSchedule, toggleSchedule } = useSchedulerStore();
  const { settings } = useSettingsStore();
  const t = translations[settings.language];

  // Local Form State
  const [time, setTime] = useState("");
  const [targetId, setTargetId] = useState("");
  const [action, setAction] = useState<'ON' | 'OFF' | 'TOGGLE'>('ON');

  // Filter for allowed segments (Digital / On-Off only as requested)
  const allowedSegments = segments.filter(s => 
    s.segType === 'Digital' || s.segType === 'All' || s.groupType === 'register'
  );

  const handleAdd = () => {
    if (!time || !targetId) return;

    addSchedule({
        id: Math.random().toString(36).substr(2, 9),
        time,
        targetSegmentId: targetId,
        action,
        enabled: true
    });
    
    // Reset defaults
    setTargetId("");
    setAction("ON");
  };

  const getTargetName = (id: string) => segments.find(s => s.num_of_node === id)?.name || "Unknown Device";
  const getTargetGpio = (id: string) => segments.find(s => s.num_of_node === id)?.gpio || "?";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
        <Dialog.Content 
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
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-white transition-all rounded-full h-10 w-10">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
             
             {/* Builder Section */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-primary font-black text-[10px] uppercase tracking-widest border-b border-border/40 pb-2">
                    <Plus size={12} /> {t.add_schedule}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Time Input */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.exec_time}</label>
                        <Input 
                            type="time" 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                            className="h-12 text-lg text-center tracking-widest font-mono"
                        />
                    </div>

                    {/* Segment Select */}
                    <div className="space-y-2">
                         <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.target_device}</label>
                         <select 
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full h-12 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                         >
                             <option value="">-- Select --</option>
                             {allowedSegments.map(s => (
                                 <option key={s.num_of_node} value={s.num_of_node}>{s.name} (GP-{s.gpio})</option>
                             ))}
                         </select>
                    </div>
                </div>

                {/* Intelligent Suggestions Area */}
                <AnimatePresence>
                    {targetId && (
                        <MotionDiv 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                    <Power size={12} /> {t.suggested_tool}: On/Off Switch
                                </span>
                                <span className="text-[8px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">DIGITAL</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(['ON', 'OFF', 'TOGGLE'] as const).map(act => (
                                    <button
                                        key={act}
                                        onClick={() => setAction(act)}
                                        className={cn(
                                            "h-10 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                                            action === act 
                                                ? "bg-primary text-black border-primary shadow-md scale-[1.02]" 
                                                : "bg-background text-muted-foreground border-border hover:bg-secondary/10"
                                        )}
                                    >
                                        {act === 'ON' && <Check size={12} />}
                                        {act === 'OFF' && <X size={12} />}
                                        {act === 'TOGGLE' && <ArrowRight size={12} />}
                                        {act === 'ON' ? t.action_on : act === 'OFF' ? t.action_off : t.action_toggle}
                                    </button>
                                ))}
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                <Button onClick={handleAdd} disabled={!time || !targetId} className="w-full font-black tracking-widest uppercase text-[10px] h-11">
                    {t.add_schedule}
                </Button>
             </div>

             {/* Existing Schedules List */}
             <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                    <Clock size={12} /> Active Timeline
                </div>

                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/40 text-[10px] uppercase tracking-widest border-2 border-dashed border-border/50 rounded-xl">
                        {t.no_schedules}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {schedules.map(sch => (
                            <div key={sch.id} className="group flex items-center justify-between p-3 bg-secondary/5 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-background border border-border p-2 rounded-lg font-mono text-sm font-bold text-primary shadow-sm min-w-[60px] text-center">
                                        {sch.time}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                                            {getTargetName(sch.targetSegmentId)}
                                        </span>
                                        <div className="flex gap-2 text-[9px] text-muted-foreground font-medium">
                                            <span className="bg-muted/30 px-1.5 py-0.5 rounded">GP-{getTargetGpio(sch.targetSegmentId)}</span>
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded font-black",
                                                sch.action === 'ON' ? 'text-green-500 bg-green-500/10' : 
                                                sch.action === 'OFF' ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'
                                            )}>
                                                {sch.action}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <Switch checked={sch.enabled} onCheckedChange={() => toggleSchedule(sch.id)} />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeSchedule(sch.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
