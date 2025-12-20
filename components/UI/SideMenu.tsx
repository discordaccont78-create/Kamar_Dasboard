import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../lib/constants';
import { 
  Sun, Moon, Settings as SettingsIcon, Volume2, 
  X, LayoutGrid, Play, Pause, Activity, Monitor, Zap, Type, Palette, Bell
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrafficChart } from '../Analytics/TrafficChart';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';

// Inlined Slider component to avoid casing collision between components/UI/Slider.tsx and components/ui/slider.tsx
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
  const { addSegment } = useSegments();
  
  const t = translations[settings.language];
  
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
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]" />
        
        {/* Floating, Rounded Side Menu with high z-index to overlay footer */}
        <Dialog.Content 
          className={cn(
            "DialogContent fixed top-4 bottom-4 w-full max-w-[400px] bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl z-[200] shadow-2xl flex flex-col focus:outline-none overflow-hidden ring-1 ring-primary/20",
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
            
            {/* Dashboard Settings (Visual & Color) */}
            <Card className="rounded-xl border-border shadow-sm">
               <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                     <Palette size={14} /> {t.dashboard_styling}
                  </div>

                  {/* Primary Color Picker */}
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.accent_color}</label>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground">{settings.primaryColor}</span>
                        <div className="relative overflow-hidden w-8 h-8 rounded-full border border-border shadow-inner">
                           <input 
                              type="color" 
                              value={settings.primaryColor}
                              onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                           />
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* System Core Settings */}
            <Card className="rounded-xl border-border shadow-sm">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                  <Monitor size={14} /> {t.core_params}
                </div>
                
                {/* Title Input */}
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Type size={12} /> {t.dash_title}
                   </label>
                   <Input 
                      value={settings.title}
                      onChange={(e) => updateSettings({ title: e.target.value })}
                      className="h-9 font-bold text-xs text-primary"
                      placeholder={t.enter_dash_name}
                   />
                </div>

                {/* Domain / Hostname Input */}
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.net_domain}</label>
                   <Input 
                      value={settings.domain}
                      onChange={(e) => updateSettings({ domain: e.target.value })}
                      className="h-9 font-mono text-xs"
                      placeholder="e.g. iot-device"
                   />
                </div>

                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 transition-all" style={{ borderColor: `${settings.primaryColor}33` }}>
                   <div className="flex items-center gap-2">
                      <Zap size={14} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.ui_anim}</span>
                   </div>
                   <Switch 
                      checked={settings.animations}
                      onCheckedChange={(v) => updateSettings({ animations: v })}
                   />
                </div>

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 transition-all" style={{ borderColor: `${settings.primaryColor}33` }}>
                   <div className="flex items-center gap-2">
                      <Bell size={14} className="text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.sys_notif}</span>
                   </div>
                   <Switch 
                      checked={settings.enableNotifications}
                      onCheckedChange={(v) => updateSettings({ enableNotifications: v })}
                   />
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
                 <div className="flex justify-between text-[9px] font-mono uppercase mb-2 text-muted-foreground">
                    <span>{t.live_traffic}</span>
                    <span className="flex gap-2">
                      <span className="text-primary">● TX</span>
                      <span className="text-blue-500">● RX</span>
                    </span>
                 </div>
                 <TrafficChart />
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                  <span>{t.new_device}</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{t.add}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-4 items-center gap-4">
                   <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.gpio}</label>
                   <Input 
                     type="number" 
                     value={form.gpio} 
                     onChange={e => setForm({...form, gpio: e.target.value})} 
                     className="col-span-3 h-9" 
                     placeholder="Pin #"
                   />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                   <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.name}</label>
                   <Input 
                     value={form.name} 
                     onChange={e => setForm({...form, name: e.target.value})} 
                     className="col-span-3 h-9" 
                     placeholder={t.dev_name}
                   />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                   <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.type}</label>
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
                   <label className="text-right text-xs font-bold text-muted-foreground uppercase col-span-1">{t.group}</label>
                   <Input 
                     value={form.group} 
                     onChange={e => setForm({...form, group: e.target.value})} 
                     className="col-span-3 h-9" 
                     placeholder="e.g. Living Room"
                   />
                </div>
                
                <Button onClick={handleAdd} className="w-full mt-2 font-black tracking-widest text-xs">
                  {t.init_seg}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-sm">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                  <LayoutGrid size={14} /> {t.env_ui}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={settings.theme === 'light' ? 'default' : 'outline'} 
                    onClick={() => updateSettings({ theme: 'light' })}
                    className="gap-2"
                  >
                    <Sun size={16} /> {t.light}
                  </Button>
                  <Button 
                    variant={settings.theme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className="gap-2"
                  >
                    <Moon size={16} /> {t.dark}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-sm">
              <CardContent className="p-5 flex flex-col gap-6">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                  <Volume2 size={14} /> {t.audio_engine}
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50 transition-all" style={{ borderColor: `${settings.primaryColor}33` }}>
                  <div className="flex flex-col overflow-hidden mr-4">
                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.active_station}</span>
                     <span className="text-xs font-bold truncate text-primary">{MUSIC_TRACKS[settings.currentTrackIndex].title}</span>
                  </div>
                  <Button 
                    size="icon" 
                    variant={settings.bgMusic ? "default" : "outline"}
                    onClick={() => updateSettings({ bgMusic: !settings.bgMusic })}
                    className={cn(settings.bgMusic && "animate-pulse")}
                  >
                    {settings.bgMusic ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{t.master_vol}</span>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};