
import React from 'react';
import { Zap, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { useSegments } from '../../../lib/store/segments';
import { useUIStore } from '../../../lib/store/uiState';
import { useConnection } from '../../../lib/store/connection';
import { MenuSection, TechButton } from './Shared';
import { cn } from '../../../lib/utils';
import { useSoundFx } from '../../../hooks/useSoundFx';
import { SegmentType } from '../../../types/index';

export const OutputSection = ({ activeId, onToggle, t }: any) => {
    const { addSegment, segments } = useSegments();
    const { addToast } = useConnection();
    const { outputForm, setOutputForm } = useUIStore();
    const { playClick } = useSoundFx();

    const isGpioUsed = (pin: number) => {
        return segments.some(s => 
          s.gpio === pin || s.dhtPin === pin || s.dsPin === pin ||
          s.shcpPin === pin || s.stcpPin === pin || s.sdaPin === pin || s.sclPin === pin
        );
    };

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

    return (
        <MenuSection id="output" title="Output Segments" icon={Zap} activeId={activeId} onToggle={onToggle}>
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
            <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                    <Input type="number" value={outputForm.gpio} onChange={e => setOutputForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="PIN #" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                    <Input value={outputForm.name} onChange={e => setOutputForm({ name: e.target.value })} className="col-span-3 h-9" placeholder={t.dev_name} list="name-suggestions" />
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
                        <button onClick={() => setOutputForm({ onOffMode: 'toggle' })} className={cn("flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all", outputForm.onOffMode === 'toggle' ? "bg-primary/20 border-primary text-primary shadow-sm" : "bg-transparent border-input text-muted-foreground hover:bg-accent")}>Feshari (Toggle)</button>
                        <button onClick={() => setOutputForm({ onOffMode: 'momentary' })} className={cn("flex-1 h-9 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all", outputForm.onOffMode === 'momentary' ? "bg-primary/20 border-primary text-primary shadow-sm" : "bg-transparent border-input text-muted-foreground hover:bg-accent")}>Switch (Push)</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.label_on || "On Label"}</label>
                            <Input value={outputForm.onLabel} onChange={e => setOutputForm({ onLabel: e.target.value })} className="h-8" placeholder="Default: ON" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.label_off || "Off Label"}</label>
                            <Input value={outputForm.offLabel} onChange={e => setOutputForm({ offLabel: e.target.value })} className="h-8" placeholder="Default: OFF" />
                        </div>
                    </div>
                    </>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                    <Input value={outputForm.group} onChange={e => setOutputForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Optional Group" list="group-suggestions" />
                </div>
                
                <TechButton onClick={handleAddOutput} icon={Plus}>
                {t.add} Output Device
                </TechButton>
            </CardContent>
            </Card>
        </MenuSection>
    );
};
