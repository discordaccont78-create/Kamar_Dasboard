
import React from 'react';
import { Activity, ArrowRight, Trash2, Cable, CloudFog, Clock } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useSchedulerStore } from '../../lib/store/scheduler';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { ButtonTrigger } from '../../types/index';

const TRIGGER_OPTIONS: { value: ButtonTrigger; label: string }[] = [
  { value: 2, label: "HIGH (1)" },
  { value: 3, label: "LOW (0)" },
  { value: 1, label: "TOGGLE" },
  { value: 0, label: "HOLD" }
];

export const SchedulerList: React.FC = () => {
  const { schedules, removeSchedule, toggleSchedule } = useSchedulerStore();
  const { segments } = useSegments();
  const { settings } = useSettingsStore();
  const t = translations[settings.language];

  // Helper to render readable conditions
  const renderConditionText = (s: any) => {
    if (s.type === 'input') {
       return `GPIO: ${s.sourceGpio} | TRIG: ${TRIGGER_OPTIONS.find(t => t.value === s.inputTrigger)?.label || s.inputTrigger}`;
    }
    if (s.type === 'weather') {
       const source = segments.find(seg => seg.num_of_node === s.sourceSegmentId);
       const unit = s.conditionMetric === 'temp' ? '°C' : '%';
       const op = s.conditionOperator === '>' ? 'Higher than' : s.conditionOperator === '<' ? 'Lower than' : 'Equals';
       const metric = s.conditionMetric === 'temp' ? 'Temp' : 'Humidity';
       return `${source?.name || 'Unknown'} (${metric}) ${op} ${s.conditionValue}${unit}`;
    }
    return `${t.exec_time}: ${s.time}`;
  };

  const visibleSchedules = schedules.filter(s => s.type !== 'countdown');

  return (
    <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} /> Active Routines
        </div>
        {visibleSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/40 text-xs italic">
                {t.no_schedules}
            </div>
        ) : (
            <div className="space-y-3">
                {visibleSchedules.map(schedule => {
                    const target = segments.find(s => s.num_of_node === schedule.targetSegmentId);
                    return (
                        <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-secondary/5 hover:border-primary/20 transition-all group">
                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shadow-sm shrink-0 border border-white/5">
                                {schedule.type === 'input' ? <Cable size={18} /> : 
                                    schedule.type === 'weather' ? <CloudFog size={18} /> : <Clock size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate">
                                        {target?.name || "Unknown"}
                                    </span>
                                    <ArrowRight size={10} className="text-muted-foreground" />
                                    <span className={cn(
                                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                        schedule.action === 'ON' ? "bg-green-500/20 text-green-500" :
                                        schedule.action === 'OFF' ? "bg-red-500/20 text-red-500" :
                                        schedule.action === 'TOGGLE' ? "bg-blue-500/20 text-blue-500" :
                                        "bg-orange-500/20 text-orange-500"
                                    )}>
                                        {schedule.action === 'SET_VALUE' ? `PWM ${schedule.targetValue}` : schedule.action}
                                    </span>
                                </div>
                                <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                    {renderConditionText(schedule)}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Switch 
                                    checked={schedule.enabled} 
                                    onCheckedChange={() => toggleSchedule(schedule.id)} 
                                    className="scale-75"
                                />
                                <button 
                                    onClick={() => removeSchedule(schedule.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
