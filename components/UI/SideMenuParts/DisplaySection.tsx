
import React from 'react';
import { MonitorSmartphone, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { useSegments } from '../../../lib/store/segments';
import { useUIStore } from '../../../lib/store/uiState';
import { useConnection } from '../../../lib/store/connection';
import { MenuSection, TechButton } from './Shared';
import { useSoundFx } from '../../../hooks/useSoundFx';

export const DisplaySection = ({ activeId, onToggle, t }: any) => {
    const { addSegment } = useSegments();
    const { addToast } = useConnection();
    const { lcdForm, setLcdForm } = useUIStore();
    const { playClick } = useSoundFx();

    const handleAddDisplay = () => {
        playClick();
        const sda = parseInt(lcdForm.sda);
        const scl = parseInt(lcdForm.scl);
        const groupName = lcdForm.group.trim() || "Displays";
        
        if (!lcdForm.name) return;
        if (isNaN(sda) || isNaN(scl)) { addToast("Invalid I2C Pins", "error"); return; }
    
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
            groupType: 'custom',
            segType: lcdForm.type, 
            gpio: 0, 
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

    return (
        <MenuSection id="displays" title="Display Units" icon={MonitorSmartphone} activeId={activeId} onToggle={onToggle}>
            <Card className="rounded-2xl border-border shadow-sm bg-card/50">
            <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.name}</label>
                    <Input value={lcdForm.name} onChange={e => setLcdForm({ name: e.target.value })} className="col-span-3 h-9" placeholder="Display Name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">{t.group}</label>
                    <Input value={lcdForm.group} onChange={e => setLcdForm({ group: e.target.value })} className="col-span-3 h-9" placeholder="Group Name" list="group-suggestions" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest col-span-1">Type</label>
                    <select value={lcdForm.type} onChange={e => setLcdForm({ type: e.target.value as any })} className="col-span-3 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold">
                    <option value="OLED">OLED I2C</option>
                    <option value="CharLCD">LCD 16x2 I2C</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">SDA</label>
                        <Input type="number" value={lcdForm.sda} onChange={e => setLcdForm({ sda: e.target.value })} className="h-9 text-center" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">SCL</label>
                        <Input type="number" value={lcdForm.scl} onChange={e => setLcdForm({ scl: e.target.value })} className="h-9 text-center" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ADDR</label>
                        <Input value={lcdForm.address} onChange={e => setLcdForm({ address: e.target.value })} className="h-9 text-center" placeholder="0x3C" />
                    </div>
                </div>
                
                {lcdForm.type === 'OLED' ? (
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Resolution</label>
                        <select value={lcdForm.resolution} onChange={e => setLcdForm({ resolution: e.target.value as any })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold">
                        <option value="128x64">128 x 64</option>
                        <option value="128x32">128 x 32</option>
                        </select>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Cols</label>
                            <Input type="number" value={lcdForm.cols} onChange={e => setLcdForm({ cols: e.target.value })} className="h-9 text-center" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rows</label>
                            <Input type="number" value={lcdForm.rows} onChange={e => setLcdForm({ rows: e.target.value })} className="h-9 text-center" />
                        </div>
                    </div>
                )}

                <TechButton onClick={handleAddDisplay} icon={Plus}>
                Initialize Screen
                </TechButton>
            </CardContent>
            </Card>
        </MenuSection>
    );
};
