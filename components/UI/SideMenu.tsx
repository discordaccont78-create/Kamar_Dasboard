
import React, { useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { useConnection } from '../../lib/store/connection';
import { useUIStore } from '../../lib/store/uiState'; // Imported UI Store
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../lib/constants';
import { 
  Settings as SettingsIcon, X, Zap, Play, Activity, Monitor, 
  SkipBack, SkipForward, Clock, Plus, ChevronDown, Cpu, Cloud, Type, TableProperties
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn, isPersian, getFontClass } from '../../lib/utils';
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

// Collapsible Menu Section Component (Controlled)
const MenuSection = ({ id, title, icon: Icon, children, activeId, onToggle }: any) => {
  const isOpen = id === activeId;
  
  return (
    <div className="space-y-1">
      <button 
        onClick={() => onToggle(id)}
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
  
  // Use Persistent UI Store
  const { 
    activeSection, setActiveSection,
    outputForm, setOutputForm,
    inputForm, setInputForm,
    regForm, setRegForm,
    dhtForm, setDhtForm,
    timerForm, setTimerForm
  } = useUIStore();
  
  const t = translations[settings.language];

  // Accordion Toggle Handler
  const handleSectionToggle = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  // --- Validation Helpers ---
  const isGpioUsed = (pin: number) => {
    return segments.some(s => 
      s.gpio === pin || 
      s.dhtPin === pin ||
      s.dsPin === pin ||
      s.shcpPin === pin ||
      s.stcpPin === pin
    );
  };

  const isGroupTakenByTemplate = (groupName: string) => {
    return segments.some(s => 
        (s.group || "basic") === groupName && 
        (s.regBitIndex !== undefined || s.groupType === 'weather')
    );
  };

  // --- Sorting & Data Preparation for Status Table ---
  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => {
        const pinA = a.gpio || a.dhtPin || a.dsPin || 0;
        const pinB = b.gpio || b.dhtPin || b.dsPin || 0;
        return pinA - pinB;
    });
  }, [segments]);

  // --- Handlers ---

  const handleAddOutput = () => {
    const pin = parseInt(outputForm.gpio);
    const groupName = outputForm.group.trim() || "basic";

    if (!outputForm.gpio || !outputForm.name) return;
    if (isNaN(pin)) { addToast("Invalid GPIO", "error"); return; }
    
    if (isGpioUsed(pin)) {
        addToast(`GPIO ${pin} is already in use!`, "error");
        return;
    }

    if (isGroupTakenByTemplate(groupName)) {
        addToast(`Group '${groupName}' is reserved for a hardware module.`, "error");
        return;
    }

    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: outputForm.name.trim(),
      group: groupName,
      groupType: 'custom',
      segType: outputForm.type,
      gpio: pin,
      is_led_on: 'off',
      val_of_slide: 0,
      onOffMode: outputForm.onOffMode
    });
    // Clear form after success
    setOutputForm({ gpio: '', name: '', type: 'Digital', group: '', onOffMode: 'toggle' });
    addToast("Output segment added successfully", "success");
  };

  const handleAddInput = () => {
    const pin = parseInt(inputForm.gpio);
    const groupName = inputForm.group.trim() || "sensors";

    if (!inputForm.gpio || !inputForm.name) return;
    if (isNaN(pin)) { addToast("Invalid GPIO", "error"); return; }

    if (isGpioUsed(pin)) {
        addToast(`GPIO ${pin} is already in use!`, "error");
        return;
    }

    if (isGroupTakenByTemplate(groupName)) {
        addToast(`Group '${groupName}' is reserved for a hardware module.`, "error");
        return;
    }

    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: inputForm.name.trim(),
      group: groupName,
      groupType: 'input',
      segType: 'Input-0-1',
      gpio: pin,
      is_led_on: 'off',
      val_of_slide: 0,
      inputCondition: parseInt(inputForm.trigger) as any,
      inputActive: false,
      usePullup: true
    });
    // Clear form after success
    setInputForm({ gpio: '', name: '', group: '', trigger: '1' });
    addToast("Input segment added successfully", "success");
  };

  const handleAddRegister = () => {
    const ds = parseInt(regForm.ds);
    const shcp = parseInt(regForm.shcp);
    const stcp = parseInt(regForm.stcp);
    const groupName = regForm.group.trim();

    if (!groupName || isNaN(ds) || isNaN(shcp) || isNaN(stcp)) { 
        addToast("Please fill all Register fields correctly.", "error"); 
        return; 
    }

    if (isGpioUsed(ds)) { addToast(`DS Pin ${ds} is in use`, "error"); return; }
    if (isGpioUsed(shcp)) { addToast(`SHCP Pin ${shcp} is in use`, "error"); return; }
    if (isGpioUsed(stcp)) { addToast(`STCP Pin ${stcp} is in use`, "error"); return; }

    const existingGroup = segments.find(s => s.group === groupName);
    if (existingGroup && existingGroup.groupType !== 'register') {
         addToast(`Group '${groupName}' is taken by non-register devices.`, "error");
         return;
    }

    for(let i = 0; i < 8; i++) {
        addSegment({
            num_of_node: Math.random().toString(36).substr(2, 9),
            name: `BIT ${i}`,
            group: groupName,
            groupType: 'register', 
            segType: 'Digital',
            gpio: stcp, 
            dsPin: ds,
            shcpPin: shcp,
            stcpPin: stcp,
            is_led_on: 'off',
            val_of_slide: 0,
            regBitIndex: i
        });
    }

    setRegForm({ ds: '', shcp: '', stcp: '', group: '' });
    addToast(`Register Group '${groupName}' created`, "success");
  };

  const handleAddDHT = () => {
    const pin = parseInt(dhtForm.gpio);
    const groupName = dhtForm.group.trim() || "Weather_Station";

    if (!dhtForm.gpio || !dhtForm.name) return;
    if (isNaN(pin)) { addToast("Invalid GPIO", "error"); return; }

    if (isGpioUsed(pin)) {
        addToast(`Data GPIO ${pin} is already in use!`, "error");
        return;
    }

    addSegment({
        num_of_node: Math.random().toString(36).substr(2, 9),
        name: dhtForm.name.trim(),
        group: groupName,
        groupType: 'weather',
        segType: 'Input-0-1', 
        gpio: pin,
        dhtPin: pin,
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

  const timerCapableSegments = segments.filter(s => 
    s.groupType !== 'input' && s.groupType !== 'weather' && s.segType !== 'Code'
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
        <Dialog.Overlay className="DialogOverlay fixed inset-0 bg-[#daa520]/10 backdrop-blur-md z-[150]" />
        
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
            <MenuSection 
                id="output" 
                title="Output Segments" 
                icon={Zap} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
            >
              {/* ... Add Output Card ... */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                     <Input type="number" value={outputForm.gpio} onChange={e => setOutputForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="PIN #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={outputForm.name} onChange={e => setOutputForm({ name: e.target.value })} className="col-span-3 h-9" placeholder={t.dev_name} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                     <select value={outputForm.type} onChange={e => setOutputForm({ type: e.target.value as SegmentType })} className="col-span-3 h-9 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                        <option value="Digital">On/Off (Relay)</option>
                        <option value="PWM">PWM (Dimmer)</option>
                        <option value="Code">Protocol (Code)</option>
                        <option value="All">Hybrid (All)</option>
                      </select>
                  </div>
                  
                  {/* Button Mode Selector - Only visible for Digital/All */}
                  {(outputForm.type === 'Digital' || outputForm.type === 'All') && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Mode</label>
                        <div className="col-span-3 flex gap-2">
                           <button 
                             onClick={() => setOutputForm({ onOffMode: 'toggle' })}
                             className={cn(
                               "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all",
                               outputForm.onOffMode === 'toggle' 
                                 ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_-4px_var(--primary)]" 
                                 : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                             )}
                           >
                             Feshari (Toggle)
                           </button>
                           <button 
                             onClick={() => setOutputForm({ onOffMode: 'momentary' })}
                             className={cn(
                               "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all",
                               outputForm.onOffMode === 'momentary' 
                                 ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_-4px_var(--primary)]" 
                                 : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
                             )}
                           >
                             Switch (Push)
                           </button>
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={outputForm.group} onChange={e => setOutputForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Optional Group" />
                  </div>
                  
                  <TechButton onClick={handleAddOutput} icon={Plus}>
                    {t.add} Output Device
                  </TechButton>
                </CardContent>
              </Card>

              {/* ... Timer Feature ... */}
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
                                    const newForm = {};
                                    if(idx === 0) setTimerForm({ hours: val });
                                    else if(idx === 1) setTimerForm({ minutes: val });
                                    else setTimerForm({ seconds: val });
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
                        onChange={e => setTimerForm({ targetSegmentId: e.target.value })}
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

            {/* === STATUS OF YOUR DASHBOARD SECTION === */}
            <MenuSection 
                id="status" 
                title={t.dash_status || "Dashboard Status"} 
                icon={TableProperties} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
            >
              <Card className="rounded-2xl border-border shadow-sm bg-card/50 overflow-hidden">
                 <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                    <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                       <Activity size={12} /> {t.status_desc || "Hardware Map"}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="grid grid-cols-[35px_1fr_1fr_auto] bg-muted/40 p-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50 gap-2">
                       <div className="text-center">{t.gpio || "PIN"}</div>
                       <div>{t.name || "ID"}</div>
                       <div>{t.group || "GRP"}</div>
                       <div className="text-right">DATA</div>
                    </div>
                    
                    {sortedSegments.length === 0 ? (
                       <div className="p-4 text-center text-[10px] text-muted-foreground font-mono">
                          No configured segments
                       </div>
                    ) : (
                       <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                          {sortedSegments.map(seg => {
                             // Determine display state based on type
                             let displayState = "-";
                             let stateColor = "text-muted-foreground";

                             if (seg.groupType === 'weather') {
                                displayState = `${seg.temperature || 0}°C / ${seg.humidity || 0}%`;
                                stateColor = "text-blue-500";
                             } else if (seg.groupType === 'input') {
                                displayState = seg.inputActive ? "HIGH" : "LOW";
                                stateColor = seg.inputActive ? "text-primary" : "text-muted-foreground";
                             } else if (seg.segType === 'PWM' || seg.segType === 'All') {
                                displayState = `VAL: ${seg.val_of_slide}`;
                                stateColor = "text-orange-500";
                             } else if (seg.segType === 'Digital' || seg.groupType === 'register') {
                                displayState = seg.is_led_on === 'on' ? "ON" : "OFF";
                                stateColor = seg.is_led_on === 'on' ? "text-green-500" : "text-red-500";
                             }

                             // Font Logic for Names
                             const nameFont = isPersian(seg.name) ? "font-persian" : "";
                             const groupFont = isPersian(seg.group) ? "font-persian" : "";

                             return (
                                <div key={seg.num_of_node} className="grid grid-cols-[35px_1fr_1fr_auto] p-2 border-b border-border/20 last:border-0 hover:bg-secondary/5 transition-colors gap-2 items-center">
                                   <div className="text-center font-mono text-[9px] font-bold bg-muted/20 rounded py-0.5 text-foreground/70">
                                      {seg.gpio || seg.dhtPin || seg.dsPin || "-"}
                                   </div>
                                   <div className={cn("text-[9px] font-bold truncate", nameFont)}>
                                      {seg.name}
                                   </div>
                                   <div className={cn("text-[8px] uppercase tracking-wider text-muted-foreground truncate", groupFont)}>
                                      {seg.group}
                                   </div>
                                   <div className={cn("text-[9px] font-mono font-black text-right min-w-[30px]", stateColor)}>
                                      {displayState}
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    )}
                 </CardContent>
              </Card>
            </MenuSection>

            {/* ... Hardware Templates ... */}
            
            <MenuSection 
                id="hardware" 
                title="Hardware Templates" 
                icon={Cpu} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
            >
               {/* Shift Register Card */}
               <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                   <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Cpu size={12} /> Shift Register (74HC595)
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={regForm.group} onChange={e => setRegForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Register Name (e.g. Relays)" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">DS</label>
                     <Input type="number" value={regForm.ds} onChange={e => setRegForm({ ds: e.target.value })} className="col-span-3 h-9" placeholder="Data Pin (SER)" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">SHCP</label>
                     <Input type="number" value={regForm.shcp} onChange={e => setRegForm({ shcp: e.target.value })} className="col-span-3 h-9" placeholder="Clock Pin (SRCLK)" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">STCP</label>
                     <Input type="number" value={regForm.stcp} onChange={e => setRegForm({ stcp: e.target.value })} className="col-span-3 h-9" placeholder="Latch Pin (RCLK)" />
                  </div>
                  
                  <TechButton onClick={handleAddRegister} icon={Plus} variant="outline">
                    Add 74HC595 Group
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
                     <Input type="number" value={dhtForm.gpio} onChange={e => setDhtForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="Data Pin GPIO" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={dhtForm.name} onChange={e => setDhtForm({ name: e.target.value })} className="col-span-3 h-9" placeholder="Sensor Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={dhtForm.group} onChange={e => setDhtForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Weather Group" />
                  </div>
                  
                  <TechButton onClick={handleAddDHT} icon={Plus} variant="outline">
                    Add DHT Module
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            <MenuSection 
                id="inputs" 
                title="Input Sensors" 
                icon={Monitor} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
            >
              {/* ... Input Card ... */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-5 pt-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                     <Input type="number" value={inputForm.gpio} onChange={e => setInputForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="PIN #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input value={inputForm.name} onChange={e => setInputForm({ name: e.target.value })} className="col-span-3 h-9" placeholder="Sensor Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Trigger</label>
                     <select value={inputForm.trigger} onChange={e => setInputForm({ trigger: e.target.value })} className="col-span-3 h-9 rounded-md border border-white/10 bg-black/5 dark:bg-white/5 px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                        <option value="2">High (1)</option>
                        <option value="3">Low (0)</option>
                        <option value="1">Toggle</option>
                        <option value="0">Hold</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input value={inputForm.group} onChange={e => setInputForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Optional" />
                  </div>
                  
                  <TechButton onClick={handleAddInput} icon={Plus}>
                    {t.add} Sensor Input
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            <MenuSection 
                id="system" 
                title="System Core" 
                icon={Activity} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
            >
               <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                  <CardContent className="space-y-6 pt-6">
                    {/* Dashboard Title */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.dash_title}</label>
                       <Input 
                         value={settings.title} 
                         onChange={(e) => updateSettings({ title: e.target.value })} 
                         placeholder={t.enter_dash_name}
                       />
                    </div>

                    {/* Network Domain */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.net_domain}</label>
                       <Input 
                         value={settings.domain} 
                         onChange={(e) => updateSettings({ domain: e.target.value })} 
                         placeholder="iot-device"
                       />
                    </div>

                    {/* Dashboard Font Selector */}
                    <div className="space-y-2 pt-2">
                         <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Type size={12} /> Dashboard Font
                         </label>
                         <div className="grid grid-cols-2 gap-2">
                            {['Inter', 'Oswald', 'Lato', 'Montserrat', 'DinaRemaster', 'PrpggyDotted'].map((fontName) => {
                                const isSelected = settings.dashboardFont === fontName;
                                let fontClass = "font-inter";
                                if (fontName === 'Oswald') fontClass = "font-oswald";
                                if (fontName === 'Lato') fontClass = "font-lato";
                                if (fontName === 'Montserrat') fontClass = "font-montserrat";
                                if (fontName === 'DinaRemaster') fontClass = "font-dina";
                                if (fontName === 'PrpggyDotted') fontClass = "font-proggy";

                                return (
                                    <button
                                        key={fontName}
                                        onClick={() => updateSettings({ dashboardFont: fontName as any })}
                                        className={cn(
                                            "h-12 border rounded-lg flex flex-col items-center justify-center transition-all hover:bg-secondary/10",
                                            isSelected ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_-4px_var(--primary)]" : "border-white/10 text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("text-xs font-bold", fontClass)}>{fontName}</span>
                                        <span className={cn("text-[8px] opacity-60", fontClass)}>Focus and effort</span>
                                    </button>
                                );
                            })}
                         </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.ui_anim}</label>
                        <Switch checked={settings.animations} onCheckedChange={(c) => updateSettings({ animations: c })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.sys_notif}</label>
                        <Switch checked={settings.enableNotifications} onCheckedChange={(c) => updateSettings({ enableNotifications: c })} />
                      </div>
                       <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.audio_engine}</label>
                        <Switch checked={settings.bgMusic} onCheckedChange={(c) => updateSettings({ bgMusic: c })} />
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <AnimatePresence>
                      {settings.bgMusic && (
                        <MotionDiv
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-secondary/5 rounded-xl p-4 space-y-4 border border-border"
                        >
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.active_station}</span>
                              <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={handlePrevTrack} className="h-6 w-6"><SkipBack size={12} /></Button>
                                  <span className="text-[9px] font-mono font-bold text-primary truncate max-w-[100px]">{MUSIC_TRACKS[settings.currentTrackIndex]?.title}</span>
                                  <Button variant="ghost" size="icon" onClick={handleNextTrack} className="h-6 w-6"><SkipForward size={12} /></Button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60">
                                 <span>{t.master_vol}</span>
                                 <span>{settings.volume}%</span>
                              </div>
                              <Slider
                                value={[settings.volume]}
                                onValueChange={(val) => updateSettings({ volume: val[0] })}
                                max={100}
                                step={1}
                              />
                           </div>
                        </MotionDiv>
                      )}
                    </AnimatePresence>

                    {/* Theme Accent */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.accent_color}</label>
                       <div className="flex gap-2 flex-wrap">
                          {["#daa520", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"].map(color => (
                            <button
                              key={color}
                              onClick={() => updateSettings({ primaryColor: color })}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                settings.primaryColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                       </div>
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
