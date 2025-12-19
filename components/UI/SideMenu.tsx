
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../app/page';
import { 
  Sun, Moon, Settings as SettingsIcon, Volume2, 
  ChevronRight, LayoutGrid, Play, Pause, Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from './Slider';
import { TrafficChart } from '../Analytics/TrafficChart';

interface SideMenuProps { isOpen: boolean; onClose: () => void; }
const MotionDiv = motion.div as any;

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { addSegment } = useSegments();
  
  const [form, setForm] = useState({
    gpio: '',
    name: '',
    type: 'Digital' as SegmentType,
    group: ''
  });

  const handleAdd = () => {
    if (!form.gpio || !form.name) return;
    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: form.name.trim(),
      group: form.group.trim() || "basic",
      groupType: 'custom',
      segType: form.type,
      gpio: parseInt(form.gpio),
      is_led_on: 'off',
      val_of_slide: 0,
    });
    setForm({ gpio: '', name: '', type: 'Digital', group: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]" 
          />
          <MotionDiv 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-background border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold flex items-center gap-2">
                   <SettingsIcon size={20} /> System Settings
                </h2>
                <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-1">v3.1 Configuration</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronRight size={20} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
              
              <Card className="rounded-xl border-border bg-gradient-to-br from-card to-secondary/5">
                <CardHeader className="pb-3 border-b border-border/50">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Activity size={14} /> Network Analytics
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                   <div className="flex justify-between text-[9px] font-mono uppercase mb-2 text-muted-foreground">
                      <span>Live Traffic (2s Interval)</span>
                      <span className="flex gap-2">
                        <span className="text-primary">● TX</span>
                        <span className="text-blue-500">● RX</span>
                      </span>
                   </div>
                   <TrafficChart />
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                    <span>New Segment</span>
                    <span className="text-xs text-primary">ADD</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">GPIO</label>
                     <Input 
                       type="number" 
                       value={form.gpio} 
                       onChange={e => setForm({...form, gpio: e.target.value})} 
                       className="col-span-3 h-9" 
                       placeholder="Pin #"
                     />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">Name</label>
                     <Input 
                       value={form.name} 
                       onChange={e => setForm({...form, name: e.target.value})} 
                       className="col-span-3 h-9" 
                       placeholder="Device Name"
                     />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">Type</label>
                     <select 
                        value={form.type}
                        onChange={e => setForm({...form, type: e.target.value as SegmentType})}
                        className="col-span-3 flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Digital">Digital (Relay)</option>
                        <option value="PWM">PWM (Dimmer)</option>
                        <option value="All">Hybrid</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">Group</label>
                     <Input 
                       value={form.group} 
                       onChange={e => setForm({...form, group: e.target.value})} 
                       className="col-span-3 h-9" 
                       placeholder="e.g. Living Room"
                     />
                  </div>
                  
                  <Button onClick={handleAdd} className="w-full mt-2 font-black tracking-widest text-xs">
                    INITIALIZE SEGMENT
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    <LayoutGrid size={14} /> Environment UI
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant={settings.theme === 'light' ? 'default' : 'outline'} 
                      onClick={() => updateSettings({ theme: 'light' })}
                      className="gap-2"
                    >
                      <Sun size={16} /> LIGHT
                    </Button>
                    <Button 
                      variant={settings.theme === 'dark' ? 'default' : 'outline'} 
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className="gap-2"
                    >
                      <Moon size={16} /> DARK
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border">
                <CardContent className="p-5 flex flex-col gap-6">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    <Volume2 size={14} /> Audio Engine
                  </div>
                  
                  <div className="flex items-center justify-between bg-secondary/5 p-3 rounded-lg">
                    <div className="flex flex-col overflow-hidden mr-4">
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Station</span>
                       <span className="text-xs font-bold truncate text-primary">{MUSIC_TRACKS[settings.currentTrackIndex].title}</span>
                    </div>
                    <Button 
                      size="icon" 
                      onClick={() => updateSettings({ bgMusic: !settings.bgMusic })}
                      className={settings.bgMusic ? "animate-pulse" : ""}
                    >
                      {settings.bgMusic ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Master Volume</span>
                        <span className="text-[10px] font-mono font-bold">{settings.volume}%</span>
                     </div>
                     <Slider 
                        value={[settings.volume]} 
                        onValueChange={([v]) => updateSettings({ volume: v })}
                        max={100} 
                        step={1} 
                     />
                  </div>
                </CardContent>
              </Card>

            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};
