
import React from 'react';
import { Cpu, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { useSegments } from '../../../lib/store/segments';
import { useUIStore } from '../../../lib/store/uiState';
import { useConnection } from '../../../lib/store/connection';
import { MenuSection, TechButton } from './Shared';
import { useSoundFx } from '../../../hooks/useSoundFx';

export const RegisterSection = ({ activeId, onToggle, t }: any) => {
    const { addSegment, segments } = useSegments();
    const { addToast } = useConnection();
    const { regForm, setRegForm } = useUIStore();
    const { playClick } = useSoundFx();

    const isGpioUsed = (pin: number) => {
        return segments.some(s => 
          s.gpio === pin || s.dhtPin === pin || s.dsPin === pin ||
          s.shcpPin === pin || s.stcpPin === pin || s.sdaPin === pin || s.sclPin === pin
        );
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

    return (
        <MenuSection id="register" title="Shift Registers" icon={Cpu} activeId={activeId} onToggle={onToggle}>
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
            <CardContent className="space-y-5 pt-6">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">DS (Data)</label>
                            <Input type="number" value={regForm.ds} onChange={e => setRegForm({ ds: e.target.value })} className="h-9 text-center" placeholder="PIN" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">SHCP (Clock)</label>
                            <Input type="number" value={regForm.shcp} onChange={e => setRegForm({ shcp: e.target.value })} className="h-9 text-center" placeholder="PIN" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">STCP (Latch)</label>
                            <Input type="number" value={regForm.stcp} onChange={e => setRegForm({ stcp: e.target.value })} className="h-9 text-center" placeholder="PIN" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Group Name (Required)</label>
                        <Input value={regForm.group} onChange={e => setRegForm({ group: e.target.value })} className="h-9" placeholder="e.g., Living Room Lights" />
                    </div>
                </div>
                <TechButton onClick={handleAddRegister} icon={Plus}>
                Initialize 74HC595
                </TechButton>
            </CardContent>
            </Card>
        </MenuSection>
    );
};
