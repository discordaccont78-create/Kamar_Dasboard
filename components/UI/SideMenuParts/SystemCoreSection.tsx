
import React from 'react';
import { Activity, Volume2, Grid3X3, Square, Triangle, Circle, Type, Waves, Palette, Music, Check, CreditCard, LayoutGrid, Monitor } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { useSettingsStore } from '../../../lib/store/settings';
import { MenuSection } from './Shared';
import { cn } from '../../../lib/utils';
import { useSoundFx } from '../../../hooks/useSoundFx';

// --- PRE-DEFINED PROFESSIONAL PALETTES ---
const THEME_PALETTES = [
    { id: 'gold', label: 'ROYAL GOLD', primary: '#daa520', cursor: '#daa520' },
    { id: 'cyan', label: 'CYBER PUNK', primary: '#06b6d4', cursor: '#22d3ee' },
    { id: 'green', label: 'MATRIX OPS', primary: '#10b981', cursor: '#34d399' },
    { id: 'purple', label: 'SYNTH WAVE', primary: '#d946ef', cursor: '#e879f9' },
    { id: 'red', label: 'RED ALERT', primary: '#ef4444', cursor: '#f87171' },
    { id: 'blue', label: 'DEEP OCEAN', primary: '#3b82f6', cursor: '#60a5fa' },
];

const PatternButton = ({ id, icon: Icon, label, current, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "h-10 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden",
            current === id 
                ? "bg-primary/20 border-primary text-primary shadow-sm" 
                : "bg-transparent border-input text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        title={label}
    >
        <Icon size={14} strokeWidth={current === id ? 2.5 : 2} />
        <span className="text-[7px] font-black uppercase tracking-wider">{label}</span>
        {current === id && <div className="absolute inset-0 bg-primary/5" />}
    </button>
);

export const SystemCoreSection = ({ activeId, onToggle, t }: any) => {
    const { settings, updateSettings } = useSettingsStore();
    const { playBlip, playClick } = useSoundFx();

    const handleUpdate = (update: any) => {
        playBlip();
        updateSettings(update);
    };

    const handlePaletteSelect = (palette: typeof THEME_PALETTES[0]) => {
        playClick();
        updateSettings({
            primaryColor: palette.primary,
            cursorColor: palette.cursor // Waves link to this, no separate control allowed
        });
    };

    const isGrid = settings.backgroundEffect === 'grid';

    return (
        <MenuSection 
            id="system" 
            title="System Core" 
            icon={Activity} 
            activeId={activeId} 
            onToggle={onToggle}
            animations={settings.animations}
        >
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
                <CardContent className="space-y-6 pt-6">
                    
                    {/* 1. IDENTITY & NETWORK */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.dash_title}</label>
                                <Input 
                                    value={settings.title} 
                                    onChange={(e) => updateSettings({ title: e.target.value })} 
                                    className="h-8 text-[10px]"
                                    placeholder="PRO-NODE"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.net_domain}</label>
                                <Input 
                                    value={settings.domain} 
                                    onChange={(e) => updateSettings({ domain: e.target.value })} 
                                    className="h-8 text-[10px] font-mono text-primary bg-primary/5 border-primary/20"
                                    placeholder="192.168.1.X"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* 2. THEME ENGINE (Restored Palettes) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Palette size={12} /> Color Schematics
                        </label>
                        
                        <div className="grid grid-cols-3 gap-2">
                            {THEME_PALETTES.map(p => {
                                const isActive = settings.primaryColor === p.primary;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePaletteSelect(p)}
                                        className={cn(
                                            "h-8 rounded-md border flex items-center gap-2 px-2 transition-all relative overflow-hidden group",
                                            isActive 
                                                ? "border-primary/50 bg-primary/10" 
                                                : "border-transparent bg-secondary/20 hover:bg-secondary/40"
                                        )}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full shadow-sm" 
                                            style={{ backgroundColor: p.primary }}
                                        />
                                        <span className={cn(
                                            "text-[8px] font-bold uppercase tracking-wider",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {p.label}
                                        </span>
                                        {isActive && <Check size={10} className="ml-auto text-primary" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Font Selection */}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground w-12">Typeface</span>
                            <select 
                                value={settings.dashboardFont} 
                                onChange={(e) => updateSettings({ dashboardFont: e.target.value as any })}
                                className="flex-1 h-7 rounded-md text-[9px] font-bold uppercase bg-background border border-input px-2 outline-none focus:border-primary"
                            >
                                <option value="Inter">Inter UI (Standard)</option>
                                <option value="Oswald">Oswald (Compact)</option>
                                <option value="Lato">Lato (Soft)</option>
                                <option value="Montserrat">Montserrat (Wide)</option>
                                <option value="DinaRemaster">Dina (Coding)</option>
                                <option value="PrpggyDotted">Proggy (Retro)</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* 3. BACKGROUND MATRIX (Fixed Pattern Logic) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <LayoutGrid size={12} /> Matrix Pattern
                            </label>
                            
                            {/* Dual Color Toggle (Only for Shapes) */}
                            {!isGrid && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold uppercase text-muted-foreground">Dual Color</span>
                                    <Switch 
                                        checked={settings.dualColorBackground} 
                                        onCheckedChange={(c) => updateSettings({ dualColorBackground: c })} 
                                        className="scale-75 origin-right" 
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                            <PatternButton id="grid" icon={Grid3X3} label="Grid" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'grid' })} />
                            <PatternButton id="dots" icon={Circle} label="Dots" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'dots' })} />
                            <PatternButton id="squares" icon={Square} label="Box" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'squares' })} />
                            <PatternButton id="triangles" icon={Triangle} label="Tri" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'triangles' })} />
                        </div>

                        {/* Dynamic Pattern Settings */}
                        <div className="bg-secondary/5 rounded-lg p-3 border border-border/30 space-y-3">
                            {isGrid ? (
                                // GRID SPECIFIC SETTINGS
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-muted-foreground">Grid Size</label>
                                        <Input 
                                            type="number" 
                                            value={settings.gridSize || 32} 
                                            onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) })}
                                            className="h-7 text-center text-[9px]"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-muted-foreground">Line Style</label>
                                        <div className="flex bg-background rounded-md p-0.5 border border-input h-7 items-center">
                                            <button onClick={() => updateSettings({ gridLineStyle: 'solid' })} className={cn("flex-1 h-full text-[8px] font-bold rounded-sm", settings.gridLineStyle === 'solid' && "bg-primary text-black")}>Solid</button>
                                            <button onClick={() => updateSettings({ gridLineStyle: 'dashed' })} className={cn("flex-1 h-full text-[8px] font-bold rounded-sm", settings.gridLineStyle === 'dashed' && "bg-primary text-black")}>Dash</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // SHAPE SPECIFIC SETTINGS (Dots, Triangles, Squares)
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Fill Style</span>
                                    <div className="flex bg-background rounded-md p-0.5 border border-input">
                                        <button onClick={() => updateSettings({ hollowShapes: false })} className={cn("px-3 py-1 text-[8px] font-bold rounded-sm transition-colors", !settings.hollowShapes ? "bg-primary text-black" : "text-muted-foreground")}>{t.solid}</button>
                                        <button onClick={() => updateSettings({ hollowShapes: true })} className={cn("px-3 py-1 text-[8px] font-bold rounded-sm transition-colors", settings.hollowShapes ? "bg-primary text-black" : "text-muted-foreground")}>{t.hollow}</button>
                                    </div>
                                </div>
                            )}

                            {/* Text Overlay (Universal) */}
                            <div className="pt-2 border-t border-border/30">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Type size={10} /> {t.text_overlay}</label>
                                    <Switch checked={settings.enableTextPattern} onCheckedChange={(c) => updateSettings({ enableTextPattern: c })} className="scale-75 origin-right" />
                                </div>
                                {settings.enableTextPattern && (
                                    <Input 
                                        value={settings.textPatternValue} 
                                        onChange={(e) => updateSettings({ textPatternValue: e.target.value })} 
                                        className="h-7 text-[9px] text-center uppercase tracking-[0.2em] bg-background" 
                                        placeholder={t.enter_text_pattern}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* 4. HEADER MECHANICS (Constrained) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Waves size={12} /> Header Mechanics
                        </label>
                        <div className="bg-secondary/5 rounded-lg p-3 border border-border/30 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-[8px] font-mono font-bold text-muted-foreground w-10">GAP</span>
                                {/* Constraint: Max 80px, Min 0px */}
                                <Slider 
                                    value={[settings.headerGap || 40]} 
                                    onValueChange={(v) => updateSettings({ headerGap: v[0] })} 
                                    max={80} 
                                    min={0}
                                    step={1} 
                                    className="flex-1" 
                                />
                                <span className="text-[8px] font-mono font-bold text-primary w-6 text-right">{settings.headerGap}px</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[8px] font-mono font-bold text-muted-foreground w-10">OPACITY</span>
                                <Slider 
                                    value={[settings.headerWaveOpacity || 90]} 
                                    onValueChange={(v) => updateSettings({ headerWaveOpacity: v[0] })} 
                                    max={100} 
                                    step={5}
                                    className="flex-1" 
                                />
                                <span className="text-[8px] font-mono font-bold text-primary w-6 text-right">{settings.headerWaveOpacity}%</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <label className="text-[8px] font-bold uppercase text-muted-foreground">Dynamic Pulse</label>
                                <Switch checked={settings.headerDynamicIntensity} onCheckedChange={(c) => updateSettings({ headerDynamicIntensity: c })} className="scale-75 origin-right" />
                            </div>
                        </div>
                    </div>

                    {/* 5. AUDIO & UX */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between bg-secondary/5 p-2 rounded-lg border border-border/30">
                            <label className="text-[8px] font-bold uppercase text-muted-foreground">{t.ui_sfx}</label>
                            <Switch checked={settings.enableSFX} onCheckedChange={(c) => handleUpdate({ enableSFX: c })} className="scale-75" />
                        </div>
                        <div className="flex items-center justify-between bg-secondary/5 p-2 rounded-lg border border-border/30">
                            <label className="text-[8px] font-bold uppercase text-muted-foreground">{t.audio_engine}</label>
                            <Switch checked={settings.bgMusic} onCheckedChange={(c) => handleUpdate({ bgMusic: c })} className="scale-75" />
                        </div>
                    </div>

                </CardContent>
            </Card>
        </MenuSection>
    );
};
