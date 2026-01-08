
import React from 'react';
import { Monitor, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { useSegments } from '../../../lib/store/segments';
import { useUIStore } from '../../../lib/store/uiState';
import { useConnection } from '../../../lib/store/connection';
import { MenuSection, TechButton } from './Shared';
import { useSoundFx } from '../../../hooks/useSoundFx';

export const InputSection = ({ activeId, onToggle, t }: any) => {
    const { addSegment, segments } = useSegments();
    const { addToast } = useConnection();
    const { inputForm, setInputForm } = useUIStore();
    const { playClick } = useSoundFx();

    const isGpioUsed = (pin: number) => {
        return segments.some(s => 
          s.gpio === pin || s.dhtPin === pin || s.dsPin === pin ||
          s.shcpPin === pin || s.stcpPin === pin || s.sdaPin === pin || s.sclPin === pin
        );
    };

    const handleAddInput = () => {
        playClick();
        const pin = parseInt(inputForm.gpio);
        const groupName = inputForm.group.trim() || "Inputs";
    
        if (!inputForm.gpio || !inputForm.name) return;
        if (isNaN(pin)) { addToast("Invalid GPIO", "error"); return; }
    
        if (isGpioUsed(pin)) {
            addToast(`GPIO ${pin} is already in use!`, "error");
            return;
        }
    
        addSegment({
            num_of_node: Math.random().toString(36).substr(2, 9),
            name: inputForm.name.trim(),
            group: groupName,
            groupType: 'custom',
            segType: 'Input-0-1',
            gpio: pin,
            is_led_on: 'off',
            val_of_slide: 0,
            inputCondition: 1, 
            inputActive: false
        });
        setInputForm({ gpio: '', name: '', group: '', trigger: '1' });
        addToast("Input sensor added", "success");
    };

    return (
        <MenuSection id="input" title="Input Sensors" icon={Monitor} activeId={activeId} onToggle={onToggle}>
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
            <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.gpio}</label>
                    <Input type="number" value={inputForm.gpio} onChange={e => setInputForm({ gpio: e.target.value })} className="col-span-3 h-9" placeholder="PIN #" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                    <Input value={inputForm.name} onChange={e => setInputForm({ name: e.target.value })} className="col-span-3 h-9" placeholder="Sensor Name" list="name-suggestions" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                    <Input value={inputForm.group} onChange={e => setInputForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Inputs" list="group-suggestions" />
                </div>
                <TechButton onClick={handleAddInput} icon={Plus}>
                {t.add} Input Sensor
                </TechButton>
            </CardContent>
            </Card>
        </MenuSection>
    );
};
