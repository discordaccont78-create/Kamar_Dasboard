
import React from 'react';
import { Layers, RectangleHorizontal, Columns, LayoutGrid, Cpu, CornerRightDown, ChevronLeft } from 'lucide-react';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';

const CLIP_HEADER = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";
const CLIP_BODY = "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% calc(50% - 15px), calc(100% - 15px) 50%, 100% calc(50% + 15px), 100% 100%, 20px 100%, 0 calc(100% - 20px))";

interface GroupFrameProps {
    name: string;
    itemCount: number;
    cols: number;
    dragHandle?: React.ReactNode;
    onUpdateCols: (c: 1 | 2 | 3) => void;
    children: React.ReactNode;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const GroupFrame: React.FC<GroupFrameProps> = ({ 
    name, 
    itemCount, 
    cols, 
    dragHandle, 
    onUpdateCols, 
    children
}) => {
    const { settings } = useSettingsStore();
    const zoneFontClass = isPersian(name) ? "font-persian" : getFontClass(settings.dashboardFont);
    const accentColor = settings.cursorColor || '#daa520';

    return (
        <div className="flex flex-col gap-3 h-full group/panel">
            {/* --- HEADER --- */}
            <div className="relative shrink-0 filter drop-shadow-md group/header">
                <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-all duration-300 group-hover/header:bg-primary/40" style={{ clipPath: CLIP_HEADER }} />
                <div className="relative h-14 bg-secondary/90 dark:bg-[#121214]/95 backdrop-blur-xl flex items-stretch justify-between overflow-hidden" style={{ clipPath: CLIP_HEADER, margin: '1px' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/50 group-hover/header:bg-primary transition-colors shadow-[0_0_10px_var(--primary)] z-20" />
                    <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,currentColor_5px,currentColor_6px)] pointer-events-none" />

                    <div className="flex items-center gap-4 pl-0 relative z-10 h-full">
                        {dragHandle && (
                            <div className="h-full flex items-center justify-center pl-5 pr-4 border-r border-white/5 bg-white/5 hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing group/handle">
                                {dragHandle}
                            </div>
                        )}
                        <div className="flex flex-col justify-center h-full py-1.5 gap-0.5 pl-2">
                            <div className="flex items-center gap-1.5 text-[7px] font-mono font-bold uppercase tracking-widest text-primary/80">
                                <Layers size={8} />
                                <span>ZONE_ID</span>
                                <span className="w-8 h-px bg-primary/30" />
                            </div>
                            <span className={cn("text-base md:text-lg font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2 drop-shadow-sm leading-none", zoneFontClass)}>
                                {name}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center h-full pr-5 relative z-10">
                        <div className="hidden lg:flex items-center gap-1 mr-4 bg-black/10 dark:bg-white/5 p-1 rounded-md border border-white/5">
                            <button onClick={() => onUpdateCols(1)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 1 ? "text-primary bg-white/10" : "text-muted-foreground")}><RectangleHorizontal size={14} /></button>
                            <button onClick={() => onUpdateCols(2)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 2 ? "text-primary bg-white/10" : "text-muted-foreground")}><Columns size={14} /></button>
                            <button onClick={() => onUpdateCols(3)} className={cn("p-1 rounded hover:bg-white/10 transition-colors", cols === 3 ? "text-primary bg-white/10" : "text-muted-foreground")}><LayoutGrid size={14} /></button>
                        </div>
                        <div className="h-full w-8 relative flex items-center justify-center opacity-20"><div className="h-8 w-px bg-foreground rotate-12" /></div>
                        <div className="flex flex-col items-end justify-center mr-3">
                            <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">MODULES</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black font-mono text-foreground tracking-tight leading-none">{itemCount.toString().padStart(2, '0')}</span>
                                <div className={cn("h-1.5 w-1.5 rounded-none transition-colors duration-500", itemCount > 0 ? "bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" : "bg-muted")} />
                            </div>
                        </div>
                        <div className="h-9 w-9 bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover/header:text-primary group-hover/header:bg-primary/10 transition-all relative" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}>
                            <Cpu size={16} strokeWidth={2} />
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-[6px] pointer-events-none opacity-30" style={{ backgroundImage: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)` }} />
                </div>
            </div>

            {/* --- BODY --- */}
            <div className="relative flex-1 filter drop-shadow-lg">
                <div className="absolute inset-0 bg-border/60 dark:bg-white/10 backdrop-blur-md transition-colors duration-300 group-hover/panel:bg-primary/20" style={{ clipPath: CLIP_BODY }} />
                <div className="relative h-full bg-background/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl p-[1px] overflow-hidden" style={{ clipPath: CLIP_BODY, margin: '1px' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover/panel:bg-primary/60 transition-colors shadow-[0_0_15px_var(--primary)] z-20 opacity-80" />
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

                    <div className="p-4 md:p-5 relative z-10 h-full">
                        {/* Fixed: Render children directly without extra wrapper to prevent grid conflicts */}
                        {children}
                    </div>
                    
                    {/* Right Side Notch Accent */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-50 group-hover/panel:opacity-100 transition-opacity">
                        <div className="w-4 h-12 border-l border-primary/20" />
                        <ChevronLeft size={12} className="text-primary absolute right-[1px]" />
                    </div>

                    <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none opacity-40" style={{ backgroundImage: `linear-gradient(135deg, transparent 60%, ${accentColor} 60%)` }} />
                    <div className="absolute bottom-1 right-1 p-1 opacity-80 pointer-events-none text-primary/80"><CornerRightDown size={12} /></div>
                </div>
            </div>
        </div>
    );
};
