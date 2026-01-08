
import React from 'react';
import { Cloud, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { useSegments } from '../../../lib/store/segments';
import { useUIStore } from '../../../lib/store/uiState';
import { useConnection } from '../../../lib/store/connection';
import { MenuSection, TechButton } from './Shared';
import { useSoundFx } from '../../../hooks/useSoundFx';

export const WeatherSection = ({ activeId, onToggle, t }: any) => {
    const { addSegment, segments } = useSegments();
    const { addToast } = useConnection();
    const { dhtForm, setDhtForm } = useUIStore();
    const { playClick } = useSoundFx();

    const isGpioUsed = (pin: number) => {
        return segments.some(s => 
          s.gpio === pin || s.dhtPin === pin || s.dsPin === pin ||
          s.shcpPin === pin || s.stcpPin === pin || s.sdaPin === pin || s.sclPin === pin
        );
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
            groupType: 'custom',
            segType: 'DHT',
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

    return (
        <MenuSection id="weather" title="Weather Modules" icon={Cloud} activeId={activeId} onToggle={onToggle}>
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
            <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                    <Input type="number" value={dhtForm.gpio} onChange={e => setDhtForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="Data PIN" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                    <Input value={dhtForm.name} onChange={e => setDhtForm({ name: e.target.value })} className="col-span-3 h-9" placeholder="Location Name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                    <Input value={dhtForm.group} onChange={e => setDhtForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Group Name" list="group-suggestions" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.type}</label>
                    <select value={dhtForm.type} onChange={e => setDhtForm({ type: e.target.value as any })} className="col-span-3 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold">
                    <option value="DHT11">DHT11</option>
                    <option value="DHT22">DHT22 (AM2302)</option>
                    </select>
                </div>
                <TechButton onClick={handleAddDHT} icon={Plus}>
                Add Weather Station
                </TechButton>
            </CardContent>
            </Card>
        </MenuSection>
    );
};
