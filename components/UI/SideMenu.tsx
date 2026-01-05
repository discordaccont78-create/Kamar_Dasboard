import React, { useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { useConnection } from '../../lib/store/connection';
import { useUIStore } from '../../lib/store/uiState';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../lib/constants';
import { 
  Settings as SettingsIcon, X, Zap, Play, Activity, Monitor, 
  SkipBack, SkipForward, Clock, Plus, ChevronDown, Cpu, Cloud, Type, TableProperties,
  Grid3X3, CircleDot, MousePointer2, Palette, Volume2, Square, Triangle, Circle, Sticker, Droplets,
  Ruler, PenTool, Hash, MonitorSmartphone
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Slider } from './Slider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { translations } from '../../lib/i18n';
import { useSoundFx } from '../../hooks/useSoundFx';

// Workaround for Framer Motion types
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

const DialogOverlay = Dialog.Overlay as any;
const DialogContent = Dialog.Content as any;
const DialogTitle = Dialog.Title as any;
const DialogClose = Dialog.Close as any;

interface SideMenuProps { isOpen: boolean; onClose: () => void; }

const TechButton = ({ children, onClick, className, variant = 'primary', icon: Icon }: any) => {
    const baseClass = "relative w-full h-10 font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 rounded-lg group overflow-hidden";
    
    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-white/10",
        outline: "bg-transparent border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-sm",
        ghost: "bg-secondary/10 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
    };

    return (
        <button onClick={onClick} className={cn(baseClass, variants[variant as keyof typeof variants], className)}>
            {Icon && <Icon size={14} className={cn("transition-transform group-hover:scale-110", variant === 'primary' ? 'stroke-[3px]' : '')} />}
            <span className="z-10">{children}</span>
        </button>
    );
};

const MenuSection = ({ id, title, icon: Icon, children, activeId, onToggle, animations }: any) => {
  const isOpen = id === activeId;
  const { playSweep } = useSoundFx();

  const handleToggle = () => {
      playSweep();
      onToggle(id);
  }
  
  return (
    <div className="space-y-1">
      <button 
        onClick={handleToggle}
        className={cn(
            "w-full flex items-center gap-3 group outline-none relative overflow-hidden transition-all duration-300 select-none",
            isOpen 
                ? "py-4 px-4 bg-primary/10 border-l-4 border-primary" 
                : "py-3 px-2 border-l-4 border-transparent hover:bg-accent/50 hover:pl-3"
        )}
      >
        <div className={cn(
          "transition-all duration-300 z-10",
          isOpen ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary/70"
        )}>
            <Icon size={isOpen ? 18 : 16} strokeWidth={isOpen ? 2.5 : 2} />
        </div>
        
        <MotionSpan 
            initial={false}
            animate={animations ? { x: isOpen ? 4 : 0 } : {}}
            className={cn(
                "text-[11px] font-black uppercase tracking-[0.2em] transition-colors z-10",
                isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80"
            )}
        >
            {title}
        </MotionSpan>

        {!isOpen && (
            <div className="h-px flex-1 bg-border/40 group-hover:bg-primary/30 transition-colors ml-2" />
        )}

        <div className={cn(
          "text-muted-foreground transition-all duration-300 ml-auto z-10",
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
             <div className="pb-4 pt-1 space-y-4 px-2 border-l border-border/20 ml-4">
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
  const { playBlip, playClick } = useSoundFx();
  
  const { 
    activeSection, setActiveSection,
    outputForm, setOutputForm,
    regForm, setRegForm,
    dhtForm, setDhtForm,
    lcdForm, setLcdForm,
    timerForm, setTimerForm
  } = useUIStore();
  
  const t = translations[settings.language];

  const handleSectionToggle = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const handleUpdateSetting = (update: any) => {
      playBlip();
      updateSettings(update);
  };

  const uniqueGroups = useMemo<string[]>(() => {
    const groups = new Set(segments.map(s => s.group).filter((g): g is string => !!g));
    return Array.from(groups).sort() as string[];
  }, [segments]);

  const uniqueNames = useMemo<string[]>(() => {
    const names = new Set(segments.map(s => s.name).filter((n): n is string => !!n));
    return Array.from(names).sort() as string[];
  }, [segments]);

  const isGpioUsed = (pin: number) => {
    return segments.some(s => 
      s.gpio === pin || 
      s.dhtPin === pin || 
      s.dsPin === pin ||
      s.shcpPin === pin ||
      s.stcpPin === pin || 
      s.sdaPin === pin ||
      s.sclPin === pin
    );
  };

  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => {
        const pinA = a.gpio || a.dhtPin || a.dsPin || a.sdaPin || 0;
        const pinB = b.gpio || b.dhtPin || b.dsPin || b.sdaPin || 0;
        return pinA - pinB;
    });
  }, [segments]);

  const handleAddOutput = () => {
    playClick();
    const pin = parseInt(outputForm.gpio);
    const groupName = outputForm.group.trim() || "basic";

    if (!outputForm.gpio || !outputForm.name) return;
    if (isNaN(pin)) { addToast("Invalid GPIO", "error"); return; }
    
    if (isGpioUsed(pin)) {
        addToast(`GPIO ${pin} is already in use!`, "error");
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
      onOffMode: outputForm.onOffMode,
      onLabel: outputForm.onLabel.trim(),
      offLabel: outputForm.offLabel.trim()
    });
    setOutputForm({ gpio: '', name: '', type: 'Digital', group: '', onOffMode: 'toggle', onLabel: '', offLabel: '' });
    addToast("Output segment added successfully", "success");
  };

  const handleAddRegister = () => {
    playClick();
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
    addToast(`Register Sub-Group added to '${groupName}'`, "success");
  };

  const handleAddDisplay = () => {
    playClick();
    const sda = parseInt(lcdForm.sda);
    const scl = parseInt(lcdForm.scl);
    const groupName = lcdForm.group.trim() || "Displays";
    
    if (!lcdForm.name) return;
    if (isNaN(sda) || isNaN(scl)) { addToast("Invalid I2C Pins", "error"); return; }

    // Note: I2C bus can be shared, so we don't strictly block used pins if they are SCL/SDA, 
    // but for simplicity in this dashboard let's warn if they are used by non-i2c devices.
    // Ideally we'd check if used by a DIFFERENT type of device.
    
    let width = 0;
    let height = 0;

    if (lcdForm.type === 'OLED') {
        const [w, h] = lcdForm.resolution.split('x').map(Number);
        width = w;
        height = h;
    } else {
        width = parseInt(lcdForm.cols);
        height = parseInt(lcdForm.rows);
    }

    addSegment({
        num_of_node: Math.random().toString(36).substr(2, 9),
        name: lcdForm.name.trim(),
        group: groupName,
        groupType: 'display',
        segType: lcdForm.type,
        gpio: 0, // Placeholder, uses I2C
        sdaPin: sda,
        sclPin: scl,
        i2cAddress: lcdForm.address,
        displayWidth: width,
        displayHeight: height,
        is_led_on: 'on',
        val_of_slide: 0,
        displayContent: "READY"
    });

    setLcdForm({ name: '', group: '', type: 'OLED', sda: '21', scl: '22', address: '0x3C', resolution: '128x64', rows: '2', cols: '16' });
    addToast(`${lcdForm.type} Display added`, "success");
  };

  const handleAddDHT = () => {
    playClick();
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
        dhtType: dhtForm.type,
        temperature: 0,
        humidity: 0,
        is_led_on: 'off',
        val_of_slide: 0
    });
    setDhtForm({ gpio: '', name: '', group: '', type: 'DHT11' });
    addToast("Weather module added", "success");
  };

  const handleNextTrack = () => {
    playClick();
    const nextIndex = (settings.currentTrackIndex + 1) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: nextIndex });
  };

  const handlePrevTrack = () => {
    playClick();
    const prevIndex = (settings.currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: prevIndex });
  };

  // Logic to switch to square-matrix if font is ProggyDotted
  const headerBgClass = (() => {
    if (settings.backgroundEffect === 'dots') return 'dot-matrix pattern-bg';
    if (settings.backgroundEffect === 'squares') return 'pattern-bg';
    if (settings.backgroundEffect === 'triangles') return 'pattern-bg';
    return 'graph-paper';
  })();

  const PatternButton = ({ id, icon: Icon, label }: any) => (
    <button
        onClick={() => handleUpdateSetting({ backgroundEffect: id })}
        className={cn(
            "h-9 border rounded-lg flex items-center justify-center gap-1.5 transition-all",
            settings.backgroundEffect === id 
                ? "bg-primary/20 border-primary text-primary shadow-sm" 
                : "bg-transparent border-input text-muted-foreground hover:bg-accent"
        )}
        title={label}
    >
        <Icon size={14} />
        <span className="text-[8px] font-bold uppercase tracking-wider hidden sm:inline">{label}</span>
    </button>
  );

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

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar">
            
            <MenuSection 
                id="output" 
                title="Output Segments" 
                icon={Zap} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
                animations={settings.animations}
            >
              {/* ... Output Form Content ... */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-5 pt-6">
                  {/* ... Output Form Fields ... */}
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                     <Input type="number" value={outputForm.gpio} onChange={e => setOutputForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="PIN #" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input 
                        value={outputForm.name} 
                        onChange={e => setOutputForm({ name: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder={t.dev_name}
                        list="name-suggestions" 
                     />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                     <select value={outputForm.type} onChange={e => setOutputForm({ type: e.target.value as SegmentType })} className="col-span-3 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground">
                        <option value="Digital">On/Off (Relay)</option>
                        <option value="PWM">PWM (Dimmer)</option>
                        <option value="Code">Protocol (Code)</option>
                        <option value="All">Hybrid (All)</option>
                      </select>
                  </div>
                  
                  {(outputForm.type === 'Digital' || outputForm.type === 'All') && (
                     <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Mode</label>
                            <div className="col-span-3 flex gap-2">
                            <button 
                                onClick={() => setOutputForm({ onOffMode: 'toggle' })}
                                className={cn(
                                "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all",
                                outputForm.onOffMode === 'toggle' 
                                    ? "bg-primary/20 border-primary text-primary shadow-sm" 
                                    : "bg-transparent border-input text-muted-foreground hover:bg-accent"
                                )}
                            >
                                Feshari (Toggle)
                            </button>
                            <button 
                                onClick={() => setOutputForm({ onOffMode: 'momentary' })}
                                className={cn(
                                "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all",
                                outputForm.onOffMode === 'momentary' 
                                    ? "bg-primary/20 border-primary text-primary shadow-sm" 
                                    : "bg-transparent border-input text-muted-foreground hover:bg-accent"
                                )}
                            >
                                Switch (Push)
                            </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.label_on || "On Label"}</label>
                               <Input 
                                  value={outputForm.onLabel} 
                                  onChange={e => setOutputForm({ onLabel: e.target.value })} 
                                  className="h-8" 
                                  placeholder="Default: ON"
                               />
                           </div>
                           <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.label_off || "Off Label"}</label>
                               <Input 
                                  value={outputForm.offLabel} 
                                  onChange={e => setOutputForm({ offLabel: e.target.value })} 
                                  className="h-8" 
                                  placeholder="Default: OFF"
                               />
                           </div>
                        </div>
                     </>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input 
                        value={outputForm.group} 
                        onChange={e => setOutputForm({ group: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Optional Group" 
                        list="group-suggestions"
                     />
                  </div>
                  
                  <TechButton onClick={handleAddOutput} icon={Plus}>
                    {t.add} Output Device
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            <MenuSection 
                id="status" 
                title={t.dash_status || "Dashboard Status"} 
                icon={TableProperties} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
                animations={settings.animations}
            >
              {/* Status Content */}
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
                             } else if (seg.groupType === 'display') {
                                displayState = "ACTIVE";
                                stateColor = "text-purple-500";
                             }

                             const nameFont = isPersian(seg.name) ? "font-persian" : "";
                             const groupFont = isPersian(seg.group) ? "font-persian" : "";

                             return (
                                <div key={seg.num_of_node} className="grid grid-cols-[35px_1fr_1fr_auto] p-2 border-b border-border/20 last:border-0 hover:bg-secondary/5 transition-colors gap-2 items-center">
                                   <div className="text-center font-mono text-[9px] font-bold bg-muted/20 rounded py-0.5 text-foreground/70">
                                      {seg.gpio || seg.dhtPin || seg.dsPin || seg.sdaPin || "-"}
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

            <MenuSection 
                id="hardware_out" 
                title="Output Modules" 
                icon={Cpu} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
                animations={settings.animations}
            >
               {/* Shift Register Card */}
               <Card className="rounded-2xl border-border shadow-sm bg-card/50 mb-4">
                <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                   <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Cpu size={12} /> Shift Register (74HC595)
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input 
                        value={regForm.group} 
                        onChange={e => setRegForm({ group: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Register Name (e.g. Relays)"
                        list="group-suggestions" 
                     />
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
                    Add 74HC595 Sub-Group
                  </TechButton>
                </CardContent>
              </Card>

              {/* Display Modules Card (OLED / LCD) */}
              <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5 py-3">
                   <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-purple-500">
                      <MonitorSmartphone size={12} /> Display / LCD
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Common Fields */}
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                     <div className="col-span-3 flex gap-2">
                        <button 
                            onClick={() => setLcdForm({ type: 'OLED' })}
                            className={cn(
                                "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                                lcdForm.type === 'OLED' ? "bg-purple-500/20 border-purple-500 text-purple-500 shadow-sm" : "bg-transparent border-input text-muted-foreground"
                            )}
                        >
                            <MonitorSmartphone size={12} /> OLED
                        </button>
                        <button 
                            onClick={() => setLcdForm({ type: 'CharLCD' })}
                            className={cn(
                                "flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                                lcdForm.type === 'CharLCD' ? "bg-green-500/20 border-green-500 text-green-500 shadow-sm" : "bg-transparent border-input text-muted-foreground"
                            )}
                        >
                            <Grid3X3 size={12} /> LCD
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input 
                        value={lcdForm.name} 
                        onChange={e => setLcdForm({ name: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Screen Name" 
                        list="name-suggestions"
                     />
                  </div>

                  {/* I2C Config */}
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">I2C BUS</label>
                     <div className="col-span-3 flex gap-2">
                        <Input type="number" value={lcdForm.sda} onChange={e => setLcdForm({ sda: e.target.value })} className="h-9 flex-1" placeholder="SDA (21)" />
                        <Input type="number" value={lcdForm.scl} onChange={e => setLcdForm({ scl: e.target.value })} className="h-9 flex-1" placeholder="SCL (22)" />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">ADDR</label>
                     <Input value={lcdForm.address} onChange={e => setLcdForm({ address: e.target.value })} className="col-span-3 h-9" placeholder="0x3C or 0x27" />
                  </div>

                  {/* Specifics */}
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">CONFIG</label>
                     <div className="col-span-3">
                        {lcdForm.type === 'OLED' ? (
                            <select value={lcdForm.resolution} onChange={e => setLcdForm({ resolution: e.target.value as any })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold outline-none">
                                <option value="128x64">128 x 64 (Standard)</option>
                                <option value="128x32">128 x 32 (Slim)</option>
                            </select>
                        ) : (
                            <div className="flex gap-2">
                                <Input type="number" value={lcdForm.cols} onChange={e => setLcdForm({ cols: e.target.value })} className="h-9 flex-1" placeholder="Cols (16)" />
                                <Input type="number" value={lcdForm.rows} onChange={e => setLcdForm({ rows: e.target.value })} className="h-9 flex-1" placeholder="Rows (2)" />
                            </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input 
                        value={lcdForm.group} 
                        onChange={e => setLcdForm({ group: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Group (e.g. Living Room)" 
                        list="group-suggestions"
                     />
                  </div>

                  <TechButton onClick={handleAddDisplay} icon={Plus} variant="outline" className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10">
                    Add {lcdForm.type} Screen
                  </TechButton>
                </CardContent>
              </Card>
            </MenuSection>

            <MenuSection 
                id="hardware_in" 
                title="Input Modules" 
                icon={Cloud} 
                activeId={activeSection} 
                onToggle={handleSectionToggle}
                animations={settings.animations}
            >
              {/* Weather Station Card */}
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
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                     <select value={dhtForm.type} onChange={e => setDhtForm({ type: e.target.value as 'DHT11' | 'DHT22' })} className="col-span-3 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground">
                        <option value="DHT11">DHT11 (Blue)</option>
                        <option value="DHT22">DHT22 (White)</option>
                      </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                     <Input 
                        value={dhtForm.name} 
                        onChange={e => setDhtForm({ name: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Sensor Name" 
                        list="name-suggestions"
                     />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                     <Input 
                        value={dhtForm.group} 
                        onChange={e => setDhtForm({ group: e.target.value })} 
                        className="col-span-3 h-9" 
                        placeholder="Weather Group" 
                        list="group-suggestions"
                     />
                  </div>
                  
                  <TechButton onClick={handleAddDHT} icon={Plus} variant="outline">
                    Add DHT Module
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
                animations={settings.animations}
            >
               <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.dash_title}</label>
                       <Input 
                         value={settings.title} 
                         onChange={(e) => updateSettings({ title: e.target.value })} 
                         placeholder={t.enter_dash_name}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.net_domain}</label>
                       <Input 
                         value={settings.domain} 
                         onChange={(e) => updateSettings({ domain: e.target.value })} 
                         placeholder="iot-device"
                       />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            Background Effect
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <PatternButton id="grid" icon={Grid3X3} label="Grid Matrix" />
                            <PatternButton id="dots" icon={CircleDot} label="Dot Array" />
                            <PatternButton id="squares" icon={Square} label="Squares" />
                            <PatternButton id="triangles" icon={Triangle} label="Triangles" />
                        </div>

                        {/* GRID CONFIGURATION BLOCK - Only visible when Grid is active */}
                        {settings.backgroundEffect === 'grid' && (
                            <div className="space-y-4 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300 border-t border-border/30 pt-3">
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Ruler size={12} /> Grid Configuration
                                </label>
                                
                                {/* 1. Grid Size */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide">
                                            Cell Size
                                        </label>
                                        <span className="text-[8px] font-mono font-bold text-foreground">{settings.gridSize || 32}px</span>
                                    </div>
                                    <Slider 
                                        value={[settings.gridSize || 32]}
                                        onValueChange={(val) => updateSettings({ gridSize: val[0] })}
                                        min={10}
                                        max={100}
                                        step={2}
                                        className="h-3"
                                    />
                                </div>

                                {/* 2. Stroke Width */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide">
                                            Line Thickness
                                        </label>
                                        <span className="text-[8px] font-mono font-bold text-foreground">{settings.gridStrokeWidth || 1}px</span>
                                    </div>
                                    <Slider 
                                        value={[settings.gridStrokeWidth || 1]}
                                        onValueChange={(val) => updateSettings({ gridStrokeWidth: val[0] })}
                                        min={0.5}
                                        max={5}
                                        step={0.5}
                                        className="h-3"
                                    />
                                </div>

                                {/* 3. Line Style */}
                                <div className="space-y-2">
                                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                        <PenTool size={10} /> Line Style
                                    </label>
                                    <div className="flex bg-secondary/20 p-1 rounded-lg gap-1">
                                        {['solid', 'dashed', 'dotted'].map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => updateSettings({ gridLineStyle: style as any })}
                                                className={cn(
                                                    "flex-1 h-6 rounded text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center",
                                                    settings.gridLineStyle === style 
                                                        ? "bg-background text-primary shadow-sm" 
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
                            {/* Hollow/Solid Toggle - Only for Shapes (Not Grid) */}
                            {settings.backgroundEffect !== 'grid' && (
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Circle size={12} /> {t.pattern_style || "Pattern Style"}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold uppercase text-muted-foreground">{settings.hollowShapes ? (t.hollow || "Hollow") : (t.solid || "Solid")}</span>
                                        <Switch 
                                            checked={settings.hollowShapes} 
                                            onCheckedChange={(c) => updateSettings({ hollowShapes: c })} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Dual Tone Toggle - Only for Shapes (Not Grid) */}
                            {settings.backgroundEffect !== 'grid' && (
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Palette size={12} /> Dual-Tone Pattern
                                    </label>
                                    <Switch 
                                        checked={settings.dualColorBackground} 
                                        onCheckedChange={(c) => updateSettings({ dualColorBackground: c })} 
                                    />
                                </div>
                            )}

                            {/* Opacity Sliders - Always Visible */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Droplets size={12} /> Primary Opacity
                                        </label>
                                        <span className="text-[9px] font-mono font-bold text-primary">{settings.patternOpacity ?? 15}%</span>
                                    </div>
                                    <Slider 
                                        value={[settings.patternOpacity ?? 15]}
                                        onValueChange={(val) => updateSettings({ patternOpacity: val[0] })}
                                        max={100}
                                        step={1}
                                        className="h-4"
                                    />
                                </div>

                                {settings.dualColorBackground && settings.backgroundEffect !== 'grid' && (
                                    <MotionDiv 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-2"
                                    >
                                        <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <Droplets size={12} /> Secondary Opacity
                                            </label>
                                            <span className="text-[9px] font-mono font-bold text-primary">{settings.secondaryPatternOpacity ?? 20}%</span>
                                        </div>
                                        <Slider 
                                            value={[settings.secondaryPatternOpacity ?? 20]}
                                            onValueChange={(val) => updateSettings({ secondaryPatternOpacity: val[0] })}
                                            max={100}
                                            step={1}
                                            className="h-4"
                                        />
                                    </MotionDiv>
                                )}
                            </div>

                            {/* Text Overlay Toggle & Input */}
                            <div className="pt-2 border-t border-border/30 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Sticker size={12} /> {t.text_overlay || "Text Pattern"}
                                    </label>
                                    <Switch 
                                        checked={settings.enableTextPattern} 
                                        onCheckedChange={(c) => updateSettings({ enableTextPattern: c })} 
                                    />
                                </div>
                                <AnimatePresence>
                                    {settings.enableTextPattern && (
                                        <MotionDiv
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-3"
                                        >
                                            <Input 
                                                value={settings.textPatternValue}
                                                onChange={(e) => updateSettings({ textPatternValue: e.target.value })}
                                                placeholder={t.enter_text_pattern || "KAMYAR"}
                                                className="h-8 text-center uppercase"
                                                maxLength={12}
                                            />
                                            
                                            {/* Text Customization: Opacity & Color */}
                                            <div className="flex items-center gap-3 bg-secondary/10 p-2 rounded-lg border border-border/30">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-center text-[8px] font-bold uppercase text-muted-foreground">
                                                        <span>Opacity</span>
                                                        <span>{settings.textPatternOpacity ?? 10}%</span>
                                                    </div>
                                                    <Slider 
                                                        value={[settings.textPatternOpacity ?? 10]}
                                                        onValueChange={(val) => updateSettings({ textPatternOpacity: val[0] })}
                                                        max={100}
                                                        step={1}
                                                        className="h-3"
                                                    />
                                                </div>
                                                <div className="shrink-0 flex flex-col items-center gap-1">
                                                    <label className="text-[7px] font-bold uppercase text-muted-foreground">Color</label>
                                                    <div className="relative h-6 w-8 overflow-hidden rounded border border-border">
                                                        <input 
                                                            type="color" 
                                                            value={settings.textPatternColor || "#808080"} 
                                                            onChange={(e) => updateSettings({ textPatternColor: e.target.value })}
                                                            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </MotionDiv>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50">
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
                                        onClick={() => handleUpdateSetting({ dashboardFont: fontName as any })}
                                        className={cn(
                                            "h-12 border rounded-lg flex flex-col items-center justify-center transition-all hover:bg-secondary/10",
                                            isSelected ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-input text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("text-xs font-bold", fontClass)}>{fontName}</span>
                                        <span className={cn("text-[8px] opacity-60", fontClass)}>Focus and effort</span>
                                    </button>
                                );
                            })}
                         </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border/50">
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
                      {/* NEW: UI SFX Toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Volume2 size={12} /> {t.ui_sfx}
                        </label>
                        <Switch checked={settings.enableSFX} onCheckedChange={(c) => updateSettings({ enableSFX: c })} />
                      </div>
                    </div>

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

                    <div className="space-y-4 pt-2 border-t border-border/50">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.accent_color}</label>
                           <div className="flex gap-2 flex-wrap">
                              {["#daa520", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"].map(color => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateSetting({ primaryColor: color })}
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                    settings.primaryColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                           </div>
                       </div>
                       
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                               <MousePointer2 size={12} /> Cursor & 3rd Color
                           </label>
                           <div className="flex gap-2 flex-wrap">
                              {["#daa520", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#ffffff"].map(color => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateSetting({ cursorColor: color })}
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                    settings.cursorColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                           </div>
                       </div>
                    </div>
                  </CardContent>
               </Card>
            </MenuSection>
            
          </div>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
};