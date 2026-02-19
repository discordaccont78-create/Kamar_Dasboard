
import React from 'react';
import { motion } from 'framer-motion';
import { cn, isPersian, getFontClass } from '../../lib/utils';
import { useSettingsStore } from '../../lib/store/settings';
import { getIconForName } from '../../lib/iconMapper';
import { ItemPosition } from '../Group/DraggableDisplayItem';
import { Plus, X, GripHorizontal } from 'lucide-react';

interface SegmentCardProps {
  gpio: number;
  label: string;
  children?: React.ReactNode;
  onRemove?: () => void;
  dragHandle?: React.ReactNode;
  position?: ItemPosition;
  isLast?: boolean; 
  segmentId: string;
  variant?: 'default' | 'ghost' | 'spacer';
  onClick?: () => void; 
}

const MotionDiv = motion.div as any;

// Define Shapes Constants
const SHAPE = {
    SQUARE: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    CUT_TR: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)", 
    CUT_BL: "polygon(0 0, 100% 0, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
    CUT_DOUBLE: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
    
    // Right Notch (Middle-Right items)
    NOTCH_RIGHT: "polygon(0 0, 100% 0, 100% calc(50% - 15px), calc(100% - 15px) 50%, 100% calc(50% + 15px), 100% 100%, 0 100%)",
    
    // Solo Notch (Full item with top/bottom cuts if needed, but primarily right notch)
    SOLO_NOTCH: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% calc(50% - 15px), calc(100% - 15px) 50%, 100% calc(50% + 15px), 100% 100%, 24px 100%, 0 calc(100% - 24px))",

    // NEW SPLIT NOTCH SHAPES
    // 1. Top-Right Split: Chamfered TR + Notch cut at BR
    TOP_RIGHT_SPLIT: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)",
    
    // 2. Bottom-Right Split: Square BR (Standard) + Notch cut at TR
    BOTTOM_RIGHT_SPLIT: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
    
    // 3. Middle-Right Split Top: Square TR + Notch cut at BR
    MIDDLE_RIGHT_SPLIT_TOP: "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)",
    
    // 4. Middle-Right Split Bottom: Square BR + Notch cut at TR
    MIDDLE_RIGHT_SPLIT_BOTTOM: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",

    // Mobile specific split: If last item is also the bottom half of a notch, it needs CUT_BL + Notch Top
    BOTTOM_RIGHT_SPLIT_MOBILE: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 24px 100%, 0 calc(100% - 24px))"
};

export const SegmentCard: React.FC<SegmentCardProps> = ({ 
  gpio, 
  label, 
  children, 
  dragHandle,
  onRemove,
  position = 'solo',
  isLast = false,
  segmentId,
  variant = 'default',
  onClick
}) => {
  const { settings } = useSettingsStore();
  const labelFontClass = isPersian(label) ? "font-persian" : getFontClass(settings.dashboardFont);
  const SegmentIcon = getIconForName(label, 'device');
  const safeId = segmentId.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  // Unified Logic: Ghost and Spacer are visually identical now
  const isEmptySlot = variant === 'ghost' || variant === 'spacer';
  const isReal = !isEmptySlot;

  // --- 1. MOBILE LOGIC (Stack) ---
  let mobileClip = SHAPE.SQUARE;
  let mobileConn = { top: '-10px', bottom: '-10px' }; 

  // Basic Mobile Assignments
  if (position === 'solo') {
      mobileClip = SHAPE.SOLO_NOTCH;
      mobileConn = { top: '0', bottom: '0' };
  } else if (position === 'top-left' || position === 'top-center' || position === 'top-right') {
      mobileClip = SHAPE.CUT_TR;
      mobileConn = { top: '50%', bottom: '-10px' };
  } else if (isLast) {
      mobileClip = SHAPE.CUT_BL;
      mobileConn = { top: '-10px', bottom: '50%' };
  } else {
      mobileClip = SHAPE.SQUARE;
      mobileConn = { top: '-10px', bottom: '-10px' };
  }

  // --- 2. DESKTOP LOGIC (Grid) ---
  let desktopClip = SHAPE.SQUARE;
  let desktopConn = { top: '-10px', bottom: '-10px' };

  switch (position) {
      case 'solo':
          desktopClip = SHAPE.SOLO_NOTCH;
          desktopConn = { top: '0', bottom: '0' };
          break;
      case 'top-left':
          desktopClip = SHAPE.SQUARE;
          desktopConn = { top: '50%', bottom: '-10px' };
          break;
      case 'top-right':
          desktopClip = SHAPE.CUT_TR;
          desktopConn = { top: '50%', bottom: '-10px' };
          break;
      case 'top-center':
          desktopClip = SHAPE.SQUARE; 
          desktopConn = { top: '-10px', bottom: '-10px' };
          break;
      case 'bottom-left':
          desktopClip = SHAPE.CUT_BL;
          desktopConn = { top: '-10px', bottom: '50%' };
          break;
      case 'bottom-right':
          desktopClip = SHAPE.SQUARE;
          desktopConn = { top: '-10px', bottom: '50%' };
          break;
      case 'bottom-center':
          desktopClip = SHAPE.SQUARE; 
          desktopConn = { top: '-10px', bottom: '50%' };
          break;
      case 'bottom-solo':
          desktopClip = SHAPE.CUT_BL;
          desktopConn = { top: '-10px', bottom: '50%' };
          break;
      case 'middle-right':
          desktopClip = SHAPE.NOTCH_RIGHT;
          desktopConn = { top: '-10px', bottom: '-10px' };
          break;
          
      // --- NEW SPLIT POSITIONS ---
      case 'top-right-split':
          desktopClip = SHAPE.TOP_RIGHT_SPLIT;
          desktopConn = { top: '50%', bottom: '-10px' }; // It's top row
          // On mobile, if this is the first item, it acts like top-right
          if (position === 'top-right-split') mobileClip = SHAPE.TOP_RIGHT_SPLIT; 
          break;
      case 'bottom-right-split':
          desktopClip = SHAPE.BOTTOM_RIGHT_SPLIT;
          desktopConn = { top: '-10px', bottom: '50%' }; // It's bottom row
          if (isLast) mobileClip = SHAPE.BOTTOM_RIGHT_SPLIT_MOBILE;
          break;
      case 'middle-right-split-top':
          desktopClip = SHAPE.MIDDLE_RIGHT_SPLIT_TOP;
          desktopConn = { top: '-10px', bottom: '-10px' };
          break;
      case 'middle-right-split-bottom':
          desktopClip = SHAPE.MIDDLE_RIGHT_SPLIT_BOTTOM;
          desktopConn = { top: '-10px', bottom: '-10px' };
          break;

      default: 
          desktopClip = SHAPE.SQUARE;
          desktopConn = { top: '-10px', bottom: '-10px' };
          break;
  }

  const showConn = position !== 'solo' && isReal;

  // --- 3. POWER STRIP LOGIC ---
  // Updated: Now applies to 'spacer' variants as well if they are in the correct position.
  const hasPowerStrip = (isReal || variant === 'spacer') && (
      position === 'solo' || 
      position === 'bottom-solo' || 
      position.includes('left')
  );

  const ConnectorLine = () => (
      <div className="absolute left-0 right-0 -top-2 -bottom-2 pointer-events-none z-0">
          <div className="absolute left-[14px] w-[3px] bg-border/40 dark:bg-white/5 transition-all duration-300">
             <div className="absolute w-full bg-border/40 lg:hidden" style={{ top: mobileConn.top, bottom: mobileConn.bottom }}>
                 <div className="w-full h-full bg-primary/10 animate-pulse" />
             </div>
             <div className="absolute w-full bg-border/40 hidden lg:block" style={{ top: desktopConn.top, bottom: desktopConn.bottom }}>
                 <div className="w-full h-full bg-primary/10 animate-pulse" />
             </div>
          </div>
      </div>
  );

  return (
    <div className="relative h-full" onClick={onClick}>
        {showConn && <ConnectorLine />}

        <MotionDiv 
            layout
            className={cn(
                "relative group h-full select-none z-10", 
                isEmptySlot && "cursor-pointer opacity-70 hover:opacity-100"
            )}
        >
            {/* BORDER GLOW LAYER */}
            <div 
                className={cn(
                    "absolute inset-0 transition-all duration-300",
                    isEmptySlot 
                        ? "bg-transparent border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/40 group-hover:bg-primary/5" 
                        : "bg-border/80 dark:bg-white/10 group-hover:bg-primary/40",
                    `dynamic-clip-${safeId}`
                )}
            />
            
            <style dangerouslySetInnerHTML={{ __html: `
                .dynamic-clip-${safeId} {
                    clip-path: ${mobileClip};
                }
                @media (min-width: 1024px) {
                    .dynamic-clip-${safeId} {
                        clip-path: ${desktopClip};
                    }
                }
            `}} />

            {/* CONTENT CONTAINER LAYER */}
            <div 
                className={cn(
                    "relative h-full flex flex-col overflow-hidden",
                    isEmptySlot ? "bg-transparent" : "bg-card dark:bg-[#151518]",
                    `dynamic-clip-${safeId}`
                )}
                style={{ margin: isEmptySlot ? '0px' : '1px' }}
            >
                {/* --- NEW: POWER STRIP (Left Edge) --- */}
                {hasPowerStrip && (
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 z-20 pointer-events-none",
                        isEmptySlot ? "bg-muted-foreground/20 group-hover:bg-primary/50" : "bg-primary/50 shadow-[0_0_8px_var(--primary)]"
                    )}>
                        {/* Optional internal highlight for detail */}
                        {!isEmptySlot && <div className="absolute top-0 left-0 w-full h-1/3 bg-white/20 blur-[1px]" />}
                    </div>
                )}

                {isEmptySlot ? (
                    // --- UNIFIED EMPTY SLOT CONTENT (For both Ghost & Spacer) ---
                    <div className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-2 min-h-[120px] text-muted-foreground/40 group-hover:text-primary/80 transition-colors relative",
                        hasPowerStrip ? "pl-3" : "" // Add padding if strip is present to maintain center balance
                    )}>
                        {/* 
                           Unified Controls: 
                           Show drag handle if provided (even for ghosts).
                           Show Remove button only for real Spacers.
                        */}
                        {dragHandle && (
                            <div className="absolute top-2 left-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-foreground z-20">
                                {dragHandle}
                            </div>
                        )}
                        
                        {variant === 'spacer' && onRemove && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="absolute top-2 right-2 p-1 hover:bg-destructive hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100 z-20"
                                title="Remove Empty Slot"
                            >
                                <X size={14} />
                            </button>
                        )}
                        
                        <div className="relative">
                            <Plus size={32} strokeWidth={1} className="group-hover:scale-110 transition-transform duration-300" />
                            {variant === 'spacer' && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-current rounded-full opacity-50" />}
                        </div>
                        
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">EMPTY SLOT</span>
                        <span className="text-[6px] opacity-0 group-hover:opacity-60 uppercase tracking-widest font-mono transition-opacity delay-100">Click to Fill</span>
                    </div>
                ) : (
                    // --- STANDARD CONTENT ---
                    <>
                        {/* Header */}
                        <div className={cn("h-10 flex items-stretch border-b border-border/40 bg-secondary/5", hasPowerStrip ? "pl-1" : "")}>
                            {/* Drag Handle Container - Unstyled to let dragHandle control it */}
                            <div className="flex items-stretch shrink-0">
                                {dragHandle}
                            </div>
                            
                            <div className="flex-1 flex items-center gap-2.5 px-3 min-w-0">
                                <div className="text-primary opacity-80 shrink-0">
                                    <SegmentIcon size={14} strokeWidth={2.5} />
                                </div>
                                <span className={cn("text-[10px] font-black uppercase tracking-wider text-foreground/90 truncate pt-0.5", labelFontClass)}>
                                    {label}
                                </span>
                            </div>
                            <div className="w-[24px] relative" /> 
                            <div className="absolute top-0 right-[24px] h-full flex items-center px-2">
                                <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-primary transition-colors">
                                    GP-{gpio}
                                </span>
                            </div>
                        </div>
                        
                        {/* Body */}
                        <div className={cn("p-4 relative z-10 flex flex-col gap-4 h-full bg-gradient-to-b from-transparent to-black/[0.02]", hasPowerStrip ? "pl-5" : "")}>
                            {children}
                        </div>
                    </>
                )}

                {/* --- INDUSTRIAL DETAILS (Responsive Accents) --- */}
                {isReal && (
                    <>
                        {/* Top-Right Accent */}
                        <div className={cn(
                            "absolute top-[24px] right-0 w-1 h-4 bg-primary/20 transition-opacity",
                            (position === 'top-left' || position === 'solo' || position === 'middle-right') ? "block lg:hidden" : "", 
                            position === 'top-right' ? "hidden lg:block" : "", 
                            position === 'top-right-split' ? "hidden lg:block" : "", // Split top has chamfer, so hide accent? Or adapt.
                            position === 'solo' ? "block" : ""
                        )} />

                        {/* Bottom-Left Accent */}
                        <div className={cn(
                            "absolute bottom-[24px] left-0 w-1 h-4 bg-primary/20",
                            (isLast || position === 'solo') ? "block lg:hidden" : "", 
                            (position === 'bottom-left' || position === 'bottom-solo' || position === 'solo') ? "hidden lg:block" : "" 
                        )} />

                        {/* Hide default bottom-left detail if we have the power strip, to avoid clutter */}
                        {!hasPowerStrip && (
                            <div className={cn(
                                "absolute bottom-2 left-[12px] w-1 h-4 bg-primary/20",
                                (isLast || position === 'solo') ? "hidden lg:block" : "block", 
                                (position === 'bottom-left' || position === 'bottom-solo') ? "block lg:hidden" : ""
                            )} />
                        )}

                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/0 group-hover:bg-primary/50 transition-colors duration-500" />
                    </>
                )}

                {/* --- CORNER DECORATION --- */}
                {/* Only for specific positions */}
                {(position === 'solo' || isLast || position === 'bottom-solo') && (
                    <div className="absolute bottom-0 right-0 w-[24px] h-[24px] pointer-events-none">
                        <div className="absolute bottom-0 right-0 w-full h-full bg-primary/20" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-primary/60" />
                    </div>
                )}
            </div>
        </MotionDiv>
    </div>
  );
};
