
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Segment } from '../../types/index';
import { cn } from '../../lib/utils';
import { Monitor, Grid3X3, Edit3, Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useWebSocket } from '../../hooks/useWebSocket';
import { CMD } from '../../types/index';

interface Props {
  segment: Segment;
}

const MotionDiv = motion.div as any;

export const DisplaySegment: React.FC<Props> = ({ segment }) => {
  const isOled = segment.segType === 'OLED';
  const { sendCommand } = useWebSocket();
  const [inputText, setInputText] = useState("");

  const handleUpdateText = () => {
      // Logic to update display content usually involves sending a command
      // Here we just simulate sending the text to the display node
      // Note: We might need a specific command for Text Update, simulating with CONSOLE for now or a custom one if needed.
      // Ideally, the 'val' in sendCommand is an integer, so sending strings requires a different protocol mechanism 
      // or we just log it for this simulation.
      console.log(`Sending text to ${segment.name}: ${inputText}`);
      setInputText("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Type Info */}
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] text-muted-foreground font-black uppercase flex items-center gap-2 tracking-widest">
            {isOled ? <Monitor size={14} /> : <Grid3X3 size={14} />} 
            {isOled ? "OLED Interface" : "Char LCD Panel"}
        </label>
        <div className="flex gap-4">
            <span className="text-[8px] font-mono font-bold text-muted-foreground/70 bg-secondary/10 px-1.5 py-0.5 rounded">
                ADDR: {segment.i2cAddress || "0x27"}
            </span>
            <span className="text-[8px] font-mono font-bold text-muted-foreground/70 bg-secondary/10 px-1.5 py-0.5 rounded">
                {isOled ? `${segment.displayWidth}x${segment.displayHeight}` : `${segment.displayWidth}x${segment.displayHeight}`}
            </span>
        </div>
      </div>

      {/* Visual Representation */}
      <div className="relative group flex justify-center">
        {isOled ? (
            // OLED VISUALIZATION (Black/Blue Pixel Style)
            <div className="relative w-full max-w-[220px] aspect-[2/1] bg-black border-4 border-gray-800 rounded-lg shadow-lg overflow-hidden flex items-center justify-center p-2">
                {/* Screen Glow */}
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                
                {/* Content Placeholder */}
                <div className="text-blue-400 font-mono text-xs text-center leading-relaxed z-10">
                    <span className="block text-[10px] opacity-50 mb-1">SYSTEM READY</span>
                    <span className="font-bold text-sm text-white drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">
                        {segment.displayContent || "WAITING FOR DATA..."}
                    </span>
                </div>

                {/* Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
            </div>
        ) : (
            // CHAR LCD VISUALIZATION (Green Backlight Style)
            <div className="relative w-full max-w-[240px] aspect-[3/1] bg-[#7ec850] border-4 border-gray-700 rounded shadow-md overflow-hidden flex flex-col items-center justify-center p-2 font-mono">
                {/* LCD Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:3px_3px] pointer-events-none" />
                
                {/* Shadow Inner */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none" />

                <div className="z-10 w-full text-black/80 font-bold text-xs tracking-widest text-center">
                    {segment.displayContent ? (
                        segment.displayContent
                    ) : (
                        <>
                        <div className="opacity-40">HELLO WORLD</div>
                        <div className="opacity-40">SYSTEM OK</div>
                        </>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Control / Update Input */}
      <div className="flex gap-2 items-center bg-secondary/5 p-2 rounded-lg border border-border/50">
         <Edit3 size={14} className="text-muted-foreground ml-1" />
         <Input 
            placeholder="Send text to display..." 
            className="h-8 text-[10px] bg-transparent border-none shadow-none focus-visible:ring-0 px-2"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
         />
         <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary" onClick={handleUpdateText}>
            <Send size={14} />
         </Button>
      </div>
    </div>
  );
};
