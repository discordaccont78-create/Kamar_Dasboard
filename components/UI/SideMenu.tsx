
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { useConnection } from '../../lib/store/connection';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../lib/constants';
import { 
  Sun, Moon, Settings as SettingsIcon, Volume2, 
  X, LayoutGrid, Play, Pause, Activity, Monitor, Zap, Type, Palette, Bell,
  SkipBack, SkipForward, Clock, Power
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrafficChart } from '../Analytics/TrafficChart';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';

// Inlined Slider component
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 duration-100" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

interface SideMenuProps { isOpen: boolean; onClose: () => void; }

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { addSegment, segments, setSegmentTimer } = useSegments();
  const { addToast } = useConnection();
  
  const t = translations[settings.language];
  
  // Output Segment Form
  const [outputForm, setOutputForm] = useState({
    gpio: '',
    name: '',
    type: 'Digital' as SegmentType,
    group: ''
  });

  // Input Segment Form
  const [inputForm, setInputForm] = useState({
    gpio: '',
    name: '',
    group: '',
    trigger: '1' // 1=Toggle as default
  });

  // Timer Form
  const [timerForm, setTimerForm] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    targetSegmentId: ''
  });

  const handleAddOutput = () => {
    if (!outputForm.gpio || !outputForm.name) return;
    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: outputForm.name.trim(),
      group: outputForm.group.trim() || "basic",
      groupType: 'custom',
      segType: outputForm.type,
      gpio: parseInt(outputForm.gpio),
      is_led_on: 'off',
      val_of_slide: 0,
    });
    setOutputForm({ gpio: '', name: '', type: 'Digital', group: '' });
    addToast("Output segment added successfully", "success");
  };

  const handleAddInput = () => {
    if (!inputForm.gpio || !inputForm.name) return;
    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: inputForm.name.trim(),
      group: inputForm.group.trim() || "sensors",
      groupType: 'input',
      segType: 'Input-0-1',
      gpio: parseInt(inputForm.gpio),
      is_led_on: 'off',
      val_of_slide: 0,
      inputCondition: parseInt(inputForm.trigger) as any,
      inputActive: false,
      usePullup: true
    });
    setInputForm({ gpio: '', name: '', group: '', trigger: '1' });
    addToast("Input segment added successfully", "success");
  };

  const handleSetTimer = () => {
    if (!timerForm.targetSegmentId) {
      addToast("Please select a target segment", "error");
      return;
    }
    const totalSeconds = (timerForm.hours * 3600) + (timerForm.minutes * 60) + timerForm.seconds;
    if (totalSeconds <= 0) {
      addToast("Please set a valid duration", "error");
      return;
    }
    setSegmentTimer(timerForm.targetSegmentId, totalSeconds);
    setTimerForm({ hours: 0, minutes: 0, seconds: 0, targetSegmentId: '' });
    addToast("Timer started successfully", "success");
  };

  // Filter segments suitable for Timer (Digital/All/PWM)
  const timerCapableSegments = segments.filter(s => 
    s.groupType !== 'input' && s.groupType !== 'weather'
  );

  const handleNextTrack = () => {
    const nextIndex = (settings.currentTrackIndex + 1) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: nextIndex });
  };

  const handlePrevTrack = () => {
    const prevIndex = (settings.currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: prevIndex });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]" />
        
        <Dialog.Content 
          className={cn(
            "DialogContent fixed top-4 bottom-4 w-full max-w-[420px] bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl z-[200] shadow-2xl flex flex-col focus:outline-none overflow-hidden ring-1 ring-primary/20",
            settings.language === 'fa' ? 'left-4' : 'right-4'
          )}
        >
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-border bg-card/30">
            <Dialog.Title className="flex flex-col">
              <span className="text-lg font-bold flex items-center gap-2 text-foreground">
                 <SettingsIcon size={20} className="text-primary" /> {t.sys_config}
              </span>
              <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-1">{t.control_panel}</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 no-scrollbar">
            
            {/* === OUTPUT SEGMENTS SECTION === */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Output Segments</span>
                <div className="h-px bg-border flex-1" />
              </div>

              {/* Add Output Card */}
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Power size={14} className="text-primary" /> New Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.gpio}</label>
                     <Input type="number" value={outputForm.gpio} onChange={e => setOutputForm({...outputForm, gpio: e.target.value})} className="col-span-3 h-8" placeholder="Pin #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.name}</label>
                     <Input value={outputForm.name} onChange={e => setOutputForm({...outputForm, name: e.target.value})} className="col-span-3 h-8" placeholder={t.dev_name} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.type}</label>
                     <select value={outputForm.type} onChange={e => setOutputForm({...outputForm, type: e.target.value as SegmentType})} className="col-span-3 h-8 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="Digital">Digital (Relay)</option>
                        <option value="PWM">PWM (Dimmer)</option>
                        <option value="All">Hybrid</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.group}</label>
                     <Input value={outputForm.group} onChange={e => setOutputForm({...outputForm, group: e.target.value})} className="col-span-3 h-8" placeholder="Optional" />
                  </div>
                  <Button onClick={handleAddOutput} className="w-full mt-1 font-black tracking-widest text-xs h-8">
                    {t.add} Output
                  </Button>
                </CardContent>
              </Card>

              {/* Timer Feature (Last part of Output section) */}
              <Card className="rounded-xl border-border shadow-sm bg-gradient-to-br from-card to-secondary/5">
                <CardHeader className="pb-3 border-b border-border/50 bg-secondary/5">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Clock size={14} /> Schedule Timer
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                   <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">HH</label>
                        <Input type="number" min="0" max="23" value={timerForm.hours} onChange={e => setTimerForm({...timerForm, hours: parseInt(e.target.value) || 0})} className="h-8 text-center" />
                      </div>
                      <span className="pb-2 font-bold text-muted-foreground">:</span>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">MM</label>
                        <Input type="number" min="0" max="59" value={timerForm.minutes} onChange={e => setTimerForm({...timerForm, minutes: parseInt(e.target.value) || 0})} className="h-8 text-center" />
                      </div>
                      <span className="pb-2 font-bold text-muted-foreground">:</span>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">SS</label>
                        <Input type="number" min="0" max="59" value={timerForm.seconds} onChange={e => setTimerForm({...timerForm, seconds: parseInt(e.target.value) || 0})} className="h-8 text-center" />
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">Target Device</label>
                      <select 
                        value={timerForm.targetSegmentId}
                        onChange={e => setTimerForm({...timerForm, targetSegmentId: e.target.value})}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                         <option value="">Select Segment...</option>
                         {timerCapableSegments.map(s => (
                           <option key={s.num_of_node} value={s.num_of_node}>
                             {s.name} (GPIO {s.gpio})
                           </option>
                         ))}
                      </select>
                   </div>
                   
                   <Button onClick={handleSetTimer} variant="outline" className="w-full h-8 font-black text-xs hover:bg-primary hover:text-primary-foreground border-primary/30">
                     Start Timer
                   </Button>
                </CardContent>
              </Card>
            </div>

            {/* === INPUT SEGMENTS SECTION === */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Input Segments</span>
                <div className="h-px bg-border flex-1" />
              </div>

              {/* Add Input Card */}
              <Card className="rounded-xl border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Monitor size={14} className="text-primary" /> New Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.gpio}</label>
                     <Input type="number" value={inputForm.gpio} onChange={e => setInputForm({...inputForm, gpio: e.target.value})} className="col-span-3 h-8" placeholder="Pin #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.name}</label>
                     <Input value={inputForm.name} onChange={e => setInputForm({...inputForm, name: e.target.value})} className="col-span-3 h-8" placeholder="Sensor Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">Trigger</label>
                     <select value={inputForm.trigger} onChange={e => setInputForm({...inputForm, trigger: e.target.value})} className="col-span-3 h-8 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="2">High (1)</option>
                        <option value="3">Low (0)</option>
                        <option value="1">Toggle</option>
                        <option value="0">Hold</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.group}</label>
                     <Input value={inputForm.group} onChange={e => setInputForm({...inputForm, group: e.target.value})} className="col-span-3 h-8" placeholder="Optional" />
                  </div>
                  <Button onClick={handleAddInput} className="w-full mt-1 font-black tracking-widest text-xs h-8">
                    {t.add} Input
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* === CORE SETTINGS === */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Core System</span>
                    <div className="h-px bg-border flex-1" />
                </div>
                
                {/* Core Parameters (Notifications, Animation, Theme) - RESTORED */}
                <Card className="rounded-xl border-border shadow-sm">
                   <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                         <SettingsIcon size={14} /> {t.core_params}
                      </div>

                      {/* Notifications Toggle */}
                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Bell size={14} /> {t.sys_notif}
                         </label>
                         <Switch 
                            checked={settings.enableNotifications} 
                            onCheckedChange={(c) => updateSettings({ enableNotifications: c })} 
                         />
                      </div>

                      {/* Animations Toggle */}
                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Zap size={14} /> {t.ui_anim}
                         </label>
                         <Switch 
                            checked={settings.animations} 
                            onCheckedChange={(c) => updateSettings({ animations: c })} 
                         />
                      </div>

                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {settings.theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} {t.env_ui}
                         </label>
                         <div className="flex bg-secondary/10 rounded-lg p-1 gap-1">
                            <Button 
                               variant={settings.theme === 'light' ? 'default' : 'ghost'} 
                               size="sm" 
                               onClick={() => updateSettings({ theme: 'light' })}
                               className="h-6 text-[9px] font-black uppercase px-2"
                            >
                               {t.light}
                            </Button>
                            <Button 
                               variant={settings.theme === 'dark' ? 'default' : 'ghost'} 
                               size="sm" 
                               onClick={() => updateSettings({ theme: 'dark' })}
                               className="h-6 text-[9px] font-black uppercase px-2"
                            >
                               {t.dark}
                            </Button>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Visual Settings (Colors) */}
                <Card className="rounded-xl border-border shadow-sm">
                   <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                         <Palette size={14} /> {t.dashboard_styling}
                      </div>
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.accent_color}</label>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-muted-foreground">{settings.primaryColor}</span>
                            <div className="relative overflow-hidden w-6 h-6 rounded-full border border-border shadow-inner">
                               <input 
                                  type="color" 
                                  value={settings.primaryColor}
                                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                                  className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0"
                               />
                            </div>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                <Card className="rounded-xl border-border bg-gradient-to-br from-card to-secondary/5 overflow-hidden shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/50 bg-secondary/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                            <Activity size={14} /> {t.net_analytics}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <TrafficChart />
                    </CardContent>
                </Card>

                {/* Audio Engine */}
                <Card className="rounded-xl border-border shadow-sm">
                  <CardContent className="p-5 flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                      <Volume2 size={14} /> {t.audio_engine}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 transition-all" style={{ borderColor: `${settings.primaryColor}33` }}>
                      <div className="flex flex-col overflow-hidden mr-4 flex-1">
                         <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.active_station}</span>
                         <span className="text-xs font-bold truncate text-primary">{MUSIC_TRACKS[settings.currentTrackIndex].title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <Button size="icon" variant="ghost" onClick={handlePrevTrack} className="h-8 w-8 hover:text-primary"><SkipBack size={16} /></Button>
                         <Button size="icon" variant={settings.bgMusic ? "default" : "outline"} onClick={() => updateSettings({ bgMusic: !settings.bgMusic })} className={cn("h-9 w-9 shadow-md transition-all", settings.bgMusic && "animate-pulse shadow-primary/20")}>
                            {settings.bgMusic ? <Pause size={16} /> : <Play size={16} />}
                         </Button>
                         <Button size="icon" variant="ghost" onClick={handleNextTrack} className="h-8 w-8 hover:text-primary"><SkipForward size={16} /></Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{t.master_vol}</span>
                          <span className="text-[10px] font-mono font-bold">{settings.volume}%</span>
                       </div>
                       <Slider value={[settings.volume]} onValueChange={([v]) => updateSettings({ volume: v })} max={100} step={1} />
                    </div>
                  </CardContent>
                </Card>
            </div>
            
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
