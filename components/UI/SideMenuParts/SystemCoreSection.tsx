
import React from 'react';
import { Activity, Volume2, Grid3X3, Square, Triangle, Circle, Type, Waves, Palette, Music } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Slider } from '../../ui/slider';
import { useSettingsStore } from '../../../lib/store/settings';
import { MenuSection } from './Shared';
import { cn } from '../../../lib/utils';
import { translations } from '../../../lib/i18n';
import { useSoundFx } from '../../../hooks/useSoundFx';

const PatternButton = ({ id, icon: Icon, label, current, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "h-9 border rounded-lg flex items-center justify-center gap-1.5 transition-all",
            current === id 
                ? "bg-primary/20 border-primary text-primary shadow-sm" 
                : "bg-transparent border-input text-muted-foreground hover:bg-accent"
        )}
        title={label}
    >
        <Icon size={14} />
        <span className="text-[8px] font-bold uppercase tracking-wider hidden sm:inline">{label}</span>
    </button>
);

export const SystemCoreSection = ({ activeId, onToggle, t }: any) => {
    const { settings, updateSettings } = useSettingsStore();
    const { playBlip } = useSoundFx();

    const handleUpdate = (update: any) => {
        playBlip();
        updateSettings(update);
    };

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
                    {/* 1. General Info */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.dash_title}</label>
                            <Input 
                                value={settings.title} 
                                onChange={(e) => updateSettings({ title: e.target.value })} 
                                placeholder={t.enter_dash_name}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.net_domain}</label>
                            <Input 
                                value={settings.domain} 
                                onChange={(e) => updateSettings({ domain: e.target.value })} 
                                className="font-mono text-primary"
                                placeholder="esp32-node"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* 2. UI Toggles */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.ui_anim}</label>
                            <Switch checked={settings.animations} onCheckedChange={(c) => handleUpdate({ animations: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.sys_notif}</label>
                            <Switch checked={settings.enableNotifications} onCheckedChange={(c) => handleUpdate({ enableNotifications: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.ui_sfx}</label>
                            <Switch checked={settings.enableSFX} onCheckedChange={(c) => handleUpdate({ enableSFX: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.audio_engine}</label>
                            <Switch checked={settings.bgMusic} onCheckedChange={(c) => handleUpdate({ bgMusic: c })} />
                        </div>
                    </div>

                    {/* 3. Audio Volume */}
                    {settings.bgMusic && (
                        <div className="space-y-2 p-3 bg-secondary/10 rounded-xl border border-border/50">
                            <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                <span className="flex items-center gap-2"><Volume2 size={12} /> {t.master_vol}</span>
                                <span className="text-primary">{settings.volume}%</span>
                            </div>
                            <Slider
                                value={[settings.volume]}
                                onValueChange={(v) => updateSettings({ volume: v[0] })}
                                max={100} step={1}
                            />
                            <div className="pt-2 flex items-center justify-between gap-2">
                                <button onClick={() => updateSettings({ currentTrackIndex: Math.max(0, settings.currentTrackIndex - 1) })} className="text-[8px] font-bold uppercase p-1 hover:text-primary">PREV</button>
                                <div className="text-[8px] font-mono text-primary truncate max-w-[120px] flex items-center gap-1"><Music size={10}/> TRACK {settings.currentTrackIndex + 1}</div>
                                <button onClick={() => updateSettings({ currentTrackIndex: settings.currentTrackIndex + 1 })} className="text-[8px] font-bold uppercase p-1 hover:text-primary">NEXT</button>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-border/50" />

                    {/* 4. Background & Theme */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Palette size={12} /> {t.dashboard_styling}
                        </label>
                        
                        <div className="grid grid-cols-4 gap-2">
                            <PatternButton id="grid" icon={Grid3X3} label="Grid" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'grid' })} />
                            <PatternButton id="dots" icon={Circle} label="Dots" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'dots' })} />
                            <PatternButton id="squares" icon={Square} label="Box" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'squares' })} />
                            <PatternButton id="triangles" icon={Triangle} label="Tri" current={settings.backgroundEffect} onClick={() => handleUpdate({ backgroundEffect: 'triangles' })} />
                        </div>

                        {/* Theme Colors */}
                        <div className="flex gap-2 items-center">
                            <Input type="color" value={settings.primaryColor} onChange={(e) => updateSettings({ primaryColor: e.target.value })} className="w-12 h-8 p-0 border-0" />
                            <Input type="color" value={settings.cursorColor || "#daa520"} onChange={(e) => updateSettings({ cursorColor: e.target.value })} className="w-12 h-8 p-0 border-0" />
                            <div className="text-[8px] font-mono text-muted-foreground ml-auto uppercase">{t.accent_color}</div>
                        </div>

                        {/* Fonts */}
                        <div className="grid grid-cols-2 gap-2">
                            <select 
                                value={settings.dashboardFont} 
                                onChange={(e) => updateSettings({ dashboardFont: e.target.value as any })}
                                className="h-8 rounded-md text-[9px] font-bold uppercase bg-background border border-input px-2"
                            >
                                <option value="Inter">Inter (Clean)</option>
                                <option value="Oswald">Oswald (Bold)</option>
                                <option value="Lato">Lato (Soft)</option>
                                <option value="Montserrat">Montserrat (Wide)</option>
                                <option value="DinaRemaster">Dina (Code)</option>
                                <option value="PrpggyDotted">Proggy (Retro)</option>
                            </select>
                            <div className="flex items-center gap-2 bg-secondary/10 px-2 rounded-md border border-border/50">
                                <span className="text-[8px] font-bold uppercase text-muted-foreground">Grid Size</span>
                                <Input 
                                    type="number" 
                                    value={settings.gridSize || 32} 
                                    onChange={(e) => updateSettings({ gridSize: parseInt(e.target.value) })}
                                    className="h-6 w-full text-center text-[9px] bg-transparent border-none p-0 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Advanced Visuals (Header/Pattern) */}
                    <div className="space-y-3 bg-secondary/5 p-3 rounded-xl border border-border/30">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Waves size={10} /> Header Dynamics</label>
                            <Switch checked={settings.headerDynamicIntensity} onCheckedChange={(c) => updateSettings({ headerDynamicIntensity: c })} className="scale-75" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-muted-foreground w-8">OPC</span>
                            <Slider value={[settings.headerWaveOpacity || 90]} onValueChange={(v) => updateSettings({ headerWaveOpacity: v[0] })} max={100} className="flex-1" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-muted-foreground w-8">GAP</span>
                            <Slider value={[settings.headerGap || 40]} onValueChange={(v) => updateSettings({ headerGap: v[0] })} max={300} className="flex-1" />
                        </div>
                    </div>

                    <div className="space-y-3 bg-secondary/5 p-3 rounded-xl border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Type size={10} /> {t.text_overlay}</label>
                            <Switch checked={settings.enableTextPattern} onCheckedChange={(c) => updateSettings({ enableTextPattern: c })} className="scale-75" />
                        </div>
                        {settings.enableTextPattern && (
                            <>
                                <Input 
                                    value={settings.textPatternValue} 
                                    onChange={(e) => updateSettings({ textPatternValue: e.target.value })} 
                                    className="h-8 text-xs text-center uppercase tracking-[0.2em]" 
                                    placeholder={t.enter_text_pattern}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold uppercase text-muted-foreground">{t.pattern_style}</span>
                                    <div className="flex bg-background rounded-md p-0.5 border border-input">
                                        <button onClick={() => updateSettings({ hollowShapes: false })} className={cn("px-2 py-0.5 text-[8px] font-bold rounded-sm", !settings.hollowShapes && "bg-primary text-black")}>{t.solid}</button>
                                        <button onClick={() => updateSettings({ hollowShapes: true })} className={cn("px-2 py-0.5 text-[8px] font-bold rounded-sm", settings.hollowShapes && "bg-primary text-black")}>{t.hollow}</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                </CardContent>
            </Card>
        </MenuSection>
    );
};
