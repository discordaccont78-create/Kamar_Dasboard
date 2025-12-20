
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { useConnection } from '../../lib/store/connection';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../lib/constants';
import { 
  Sun, Moon, Settings as SettingsIcon, Volume2, 
  X, LayoutGrid, Play, Pause, Activity, Monitor, Zap, Type, Palette, Bell,
  SkipBack, SkipForward, Clock, Power, Check, Plus, ChevronDown, Cpu, Cloud
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrafficChart } from '../Analytics/TrafficChart';
import { cn } from '../../lib/utils';
import { translations } from '../../lib/i18n';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;

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
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 duration-100 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

interface SideMenuProps { isOpen: boolean; onClose: () => void; }

// Custom "Tech" Button Component
const TechButton = ({ children, onClick, className, variant = 'primary', icon: Icon }: any) => {
    const baseClass = "relative w-full h-10 font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 rounded-lg group overflow-hidden";
    
    const variants = {
        primary: "bg-primary text-black hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] hover:-translate-y-0.5 border border-white/20",
        outline: "bg-transparent border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]",
        ghost: "bg-secondary/10 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
    };

    return (
        <button onClick={onClick} className={cn(baseClass, variants[variant as keyof typeof variants], className)}>
            {Icon && <Icon size={14} className={cn("transition-transform group-hover:scale-110", variant === 'primary' ? 'stroke-[3px]' : '')} />}
            <span className="z-10">{children}</span>
        </button>
    );
};

// Collapsible Menu Section Component
const MenuSection = ({ title, icon: Icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="space-y-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 group outline-none py-3 select-none"
      >
        <div className={cn(
          "p-1.5 rounded-md transition-all duration-300",
          isOpen ? "bg-primary/10 text-primary shadow-[0_0_10px_-4px_var(--primary)]" : "bg-secondary/10 text-muted-foreground group-hover:text-primary/70"
        )}>
            <Icon size={14} />
        </div>
        <span className={cn(
          "text-[11px] font-black uppercase tracking-[0.2em] transition-colors",
          isOpen ? "text-foreground/90" : "text-muted-foreground group-hover:text-foreground/70"
        )}>
            {title}
        </span>
        <div className={cn(
          "h-px flex-1 transition-all duration-500",
          isOpen ? "bg-gradient-to-r from-primary/50 to-transparent" : "bg-border/40"
        )} />
        <div className={cn(
          "text-muted-foreground transition-all duration-300",
          isOpen ? "-rotate-180 text-primary" : "rotate-0"
        )}>
             <ChevronDown size={14} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
             <div className="pb-2 space-y-4 px-1">
                {children}
             </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

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

  // Register Form
  const [regForm, setRegForm] = useState({
    gpio: '',
    name: '',
    group: ''
  });

  // DHT Form
  const [dhtForm, setDhtForm] = useState({
    gpio: '',
    name: '',
    group: ''
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

  const handleAddRegister = () => {
    if (!regForm.gpio || !regForm.name) return;
    addSegment({
        num_of_node: Math.random().toString(36).substr(2, 9),
        name: regForm.name.trim(),
        group: regForm.group.trim() || "registers",
        groupType: 'register',
        segType: 'All', // Acts as byte holder
        gpio: parseInt(regForm.gpio), // Latch pin usually
        is_led_on: 'on',
        val_of_slide: 0 // Byte value (0-255)
    });
    setRegForm({ gpio: '', name: '', group: '' });
    addToast("Shift Register module added", "success");
  };

  const handleAddDHT = () => {
    if (!dhtForm.gpio || !dhtForm.name) return;
    addSegment({
        num_of_node: Math.random().toString(36).substr(2, 9),
        name: dhtForm.name.trim(),
        group: dhtForm.group.trim() || "weather",
        groupType: 'weather',
        segType: 'Input-0-1', // Placeholder type
        gpio: parseInt(dhtForm.gpio),
        dhtPin: parseInt(dhtForm.gpio),
        temperature: 0,
        humidity: 0
    });
    setDhtForm({ gpio: '', name: '', group: '' });
    addToast("Weather station added", "success");
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
        <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
        
        <Dialog.Content 
          className={cn(
            "DialogContent fixed top-4 bottom-4 w-full max-w-[420px] bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl z-[200] shadow-2xl flex flex-col focus:outline-none overflow-hidden ring-1 ring-white/5",
            settings.language === 'fa' ? 'left-4' : 'right-4'
          )}
        >
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-border bg-card/30 shrink-0">
            <Dialog.Title className="flex flex-col gap-1">
              <span className="text-xl font-black flex items-center gap-2 text-foreground tracking-tight">
                 <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20">
                    <SettingsIcon size={18} strokeWidth={3} />
                 </div>
                 {t.sys_config}
              </span>
              <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-60 pl-1">{t.control_panel}</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-white transition-all rounded-full h-10 w-10">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-20 no-scrollbar">
            
            {/* === OUTPUT SEGMENTS SECTION === */}
            <MenuSection title="Output Segments" icon={Zap} defaultOpen={true}>
              {/* Add Output Card */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                     <Input type="number" value={outputForm.gpio} onChange={e => setOutputForm({...outputForm, gpio: e.target.value})} className="col-span-3 h-9" placeholder="PIN #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={outputForm.name} onChange={e => setOutputForm({...outputForm, name: e.target.value})} className="col-span-3 h-9" placeholder={t.dev_name} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                     <select value={outputForm.type} onChange={e => setOutputForm({...outputForm, type: e.target.value as SegmentType})} className="col-span-3 h-9 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                        <option value="Digital">Digital (Relay)</option>
                        <option value="PWM">PWM (Dimmer)</option>
                        <option value="All">Hybrid</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={outputForm.group} onChange={e => setOutputForm({...outputForm, group: e.target.value})} className="col-span-3 h-9" placeholder="Optional Group" />
                  </div>
                  
                  <TechButton onClick={handleAddOutput} icon={Plus}>
                    {t.add} Output Device
                  </TechButton>
                </CardContent>
              </Card>

              {/* Timer Feature */}
              <Card className="rounded-2xl border-border shadow-sm bg-gradient-to-br from-card to-secondary/5 overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50 bg-secondary/5 py-4">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Clock size={14} className="animate-pulse" /> Automation Timer
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                   <div className="flex gap-2 items-center justify-center">
                      {['HH', 'MM', 'SS'].map((label, idx) => (
                        <div key={label} className="flex flex-col gap-1 items-center">
                            <Input 
                                type="number" 
                                min="0" 
                                max={idx === 0 ? 23 : 59} 
                                value={idx === 0 ? timerForm.hours : idx === 1 ? timerForm.minutes : timerForm.seconds} 
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const newForm = {...timerForm};
                                    if(idx === 0) newForm.hours = val;
                                    else if(idx === 1) newForm.minutes = val;
                                    else newForm.seconds = val;
                                    setTimerForm(newForm);
                                }} 
                                className="h-10 w-14 text-center text-lg" 
                            />
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">{label}</span>
                        </div>
                      ))}
                   </div>
                   
                   <div className="space-y-2">
                      <select 
                        value={timerForm.targetSegmentId}
                        onChange={e => setTimerForm({...timerForm, targetSegmentId: e.target.value})}
                        className="w-full h-9 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      >
                         <option value="">Select Target Device...</option>
                         {timerCapableSegments.map(s => (
                           <option key={s.num_of_node} value={s.num_of_node}>
                             {s.name} (GPIO {s.gpio})
                           </option>
                         ))}
                      </select>
                   </div>
                   
                   <TechButton variant="outline" onClick={handleSetTimer} icon={Play}>
                     Initialize Timer
                   </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            {/* === HARDWARE TEMPLATES SECTION (NEW) === */}
            <MenuSection title="Hardware Templates" icon={Cpu} defaultOpen={false}>
               {/* Shift Register Card */}
               <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                   <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Cpu size={12} /> Shift Register (74HC595)
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Latch</label>
                     <Input type="number" value={regForm.gpio} onChange={e => setRegForm({...regForm, gpio: e.target.value})} className="col-span-3 h-9" placeholder="Latch Pin GPIO" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="col-span-3 h-9" placeholder="Module Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={regForm.group} onChange={e => setRegForm({...regForm, group: e.target.value})} className="col-span-3 h-9" placeholder="Register Group" />
                  </div>
                  
                  <TechButton onClick={handleAddRegister} icon={Plus} variant="outline">
                    Add 8-Bit Register
                  </TechButton>
                </CardContent>
              </Card>

              {/* DHT Weather Card */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                   <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-blue-500">
                      <Cloud size={12} /> Weather Station (DHT)
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Data</label>
                     <Input type="number" value={dhtForm.gpio} onChange={e => setDhtForm({...dhtForm, gpio: e.target.value})} className="col-span-3 h-9" placeholder="Data Pin GPIO" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={dhtForm.name} onChange={e => setDhtForm({...dhtForm, name: e.target.value})} className="col-span-3 h-9" placeholder="Sensor Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={dhtForm.group} onChange={e => setDhtForm({...dhtForm, group: e.target.value})} className="col-span-3 h-9" placeholder="Weather Group" />
                  </div>
                  
                  <TechButton onClick={handleAddDHT} icon={Plus} variant="outline">
                    Add DHT Module
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            {/* === INPUT SEGMENTS SECTION === */}
            <MenuSection title="Input Sensors" icon={Monitor} defaultOpen={true}>
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                     <Input type="number" value={inputForm.gpio} onChange={e => setInputForm({...inputForm, gpio: e.target.value})} className="col-span-3 h-9" placeholder="PIN #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={inputForm.name} onChange={e => setInputForm({...inputForm, name: e.target.value})} className="col-span-3 h-9" placeholder="Sensor Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Trigger</label>
                     <select value={inputForm.trigger} onChange={e => setInputForm({...inputForm, trigger: e.target.value})} className="col-span-3 h-9 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                        <option value="2">High (1)</option>
                        <option value="3">Low (0)</option>
                        <option value="1">Toggle</option>
                        <option value="0">Hold</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={inputForm.group} onChange={e => setInputForm({...inputForm, group: e.target.value})} className="col-span-3 h-9" placeholder="Optional" />
                  </div>
                  
                  <TechButton onClick={handleAddInput} icon={Plus}>
                    {t.add} Sensor Input
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            {/* === CORE SETTINGS === */}
            <MenuSection title="System Core" icon={Activity} defaultOpen={true}>
                <Card className="rounded-2xl border-border shadow-sm">
                   <CardContent className="p-5 flex flex-col gap-5">
                      {/* Notifications Toggle */}
                      <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                         <label className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer">
                            <Bell size={16} /> {t.sys_notif}
                         </label>
                         <Switch 
                            checked={settings.enableNotifications} 
                            onCheckedChange={(c) => updateSettings({ enableNotifications: c })} 
                         />
                      </div>

                      {/* Animations Toggle */}
                      <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                         <label className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer">
                            <Zap size={16} /> {t.ui_anim}
                         </label>
                         <Switch 
                            checked={settings.animations} 
                            onCheckedChange={(c) => updateSettings({ animations: c })} 
                         />
                      </div>

                      {/* Theme Toggle - Segmented Control Style */}
                      <div className="flex items-center justify-between p-2">
                         <label className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {t.env_ui}
                         </label>
                         <div className="flex bg-secondary/10 p-1 rounded-lg gap-1 border border-white/5">
                            <button 
                               onClick={() => updateSettings({ theme: 'light' })}
                               className={cn(
                                   "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                   settings.theme === 'light' 
                                    ? "bg-white text-black shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                               )}
                            >
                               {t.light}
                            </button>
                            <button 
                               onClick={() => updateSettings({ theme: 'dark' })}
                               className={cn(
                                   "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                   settings.theme === 'dark' 
                                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700" 
                                    : "text-muted-foreground hover:text-foreground"
                               )}
                            >
                               {t.dark}
                            </button>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Visual Settings (Colors) */}
                <Card className="rounded-2xl border-border shadow-sm">
                   <CardContent className="p-5">
                      <div className="flex items-center justify-between p-2">
                         <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Palette size={16} /> {t.accent_color}
                         </div>
                         <div className="flex items-center gap-3 pl-4 py-1 pr-1 bg-secondary/10 rounded-full border border-border">
                            <span className="text-[9px] font-mono font-bold text-muted-foreground opacity-70">{settings.primaryColor}</span>
                            <div className="relative overflow-hidden w-8 h-8 rounded-full border-2 border-white/20 shadow-md hover:scale-110 transition-transform cursor-pointer">
                               <input 
                                  type="color" 
                                  value={settings.primaryColor}
                                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                                  className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer p-0 border-0"
                               />
                            </div>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                <Card className="rounded-2xl border-border bg-gradient-to-br from-card to-secondary/5 overflow-hidden shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/50 bg-secondary/5 py-4">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                            <Activity size={14} /> {t.net_analytics}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <TrafficChart />
                    </CardContent>
                </Card>

                {/* Audio Engine */}
                <Card className="rounded-2xl border-border shadow-sm">
                  <CardContent className="p-5 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                            <Volume2 size={14} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">{t.audio_engine}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-background to-secondary/5 transition-all shadow-sm group hover:border-primary/30" style={{ borderColor: `${settings.primaryColor}20` }}>
                      <div className="flex flex-col overflow-hidden mr-4 flex-1 gap-1">
                         <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-70">{t.active_station}</span>
                         <span className="text-xs font-bold truncate text-primary group-hover:text-foreground transition-colors">{MUSIC_TRACKS[settings.currentTrackIndex].title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <Button size="icon" variant="ghost" onClick={handlePrevTrack} className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"><SkipBack size={14} /></Button>
                         <Button 
                            size="icon" 
                            variant={settings.bgMusic ? "default" : "outline"} 
                            onClick={() => updateSettings({ bgMusic: !settings.bgMusic })} 
                            className={cn(
                                "h-10 w-10 shadow-lg rounded-xl transition-all", 
                                settings.bgMusic ? "shadow-primary/30 scale-105" : "hover:border-primary/50"
                            )}
                        >
                            {settings.bgMusic ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                         </Button>
                         <Button size="icon" variant="ghost" onClick={handleNextTrack} className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"><SkipForward size={14} /></Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 px-1">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.master_vol}</span>
                          <span className="text-[10px] font-mono font-bold text-primary">{settings.volume}%</span>
                       </div>
                       <Slider value={[settings.volume]} onValueChange={([v]) => updateSettings({ volume: v })} max={100} step={1} className="py-1" />
                    </div>
                  </CardContent>
                </Card>
            </MenuSection>
            
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
