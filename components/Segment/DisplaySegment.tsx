
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Segment, CMD } from '../../types/index';
import { cn } from '../../lib/utils';
import { Monitor, Grid3X3, Edit3, Send, Type, Paintbrush, Eraser, Download, Trash2, Binary } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Props {
  segment: Segment;
}

const MotionDiv = motion.div as any;

// --- UTILS ---
const CHAR_WIDTH = 5;
const CHAR_HEIGHT = 8;

export const DisplaySegment: React.FC<Props> = ({ segment }) => {
  const isOled = segment.segType === 'OLED';
  const { sendCommand } = useWebSocket();
  const [mode, setMode] = useState<'text' | 'pixel'>('text');
  
  // Text Mode State
  const [inputText, setInputText] = useState("");
  
  // Custom Char (LCD) State
  const [customCharGrid, setCustomCharGrid] = useState<number[]>(Array(40).fill(0)); // 5x8 = 40 bits
  
  // OLED Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- HANDLERS ---

  const handleSendText = () => {
      const address = segment.i2cAddress ? parseInt(segment.i2cAddress) : 0x3C;
      sendCommand(CMD.DISPLAY_UPDATE, address, inputText);
      setInputText("");
  };

  const toggleLcdPixel = (index: number) => {
      const newGrid = [...customCharGrid];
      newGrid[index] = newGrid[index] ? 0 : 1;
      setCustomCharGrid(newGrid);
  };

  const clearLcdGrid = () => setCustomCharGrid(Array(40).fill(0));

  // --- OLED DRAWING LOGIC ---
  const drawPixel = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isOled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = mode === 'pixel' ? '#3b82f6' : '#000000'; // Draw Blue or Erase
          ctx.fillRect(x, y, 1, 1);
      }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'pixel') return;
      setIsDrawing(true);
      drawPixel(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      drawPixel(e);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Type Info & Mode Switcher */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", isOled ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500")}>
                {isOled ? <Monitor size={14} /> : <Grid3X3 size={14} />} 
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {isOled ? "OLED MATRIX" : "CHAR LCD"}
                </span>
                <span className="text-[7px] font-mono font-bold opacity-50">
                    {isOled ? `${segment.displayWidth}x${segment.displayHeight}px` : `${segment.displayWidth}x${segment.displayHeight} Chars`}
                </span>
            </div>
        </div>

        {/* Tools Switcher */}
        <div className="flex bg-secondary/10 rounded-lg p-0.5 border border-white/5">
            <button 
                onClick={() => setMode('text')}
                className={cn(
                    "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                    mode === 'text' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Type size={10} /> Text
            </button>
            <button 
                onClick={() => setMode('pixel')}
                className={cn(
                    "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                    mode === 'pixel' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Paintbrush size={10} /> {isOled ? "Draw" : "Custom"}
            </button>
        </div>
      </div>

      {/* --- VISUALIZER AREA --- */}
      <div className="relative group flex justify-center w-full">
        
        {/* ================= CHAR LCD RENDERER ================= */}
        {!isOled && (
            <div className="relative p-3 bg-[#1a1c1e] rounded-xl border-4 border-[#2d3035] shadow-2xl w-full max-w-[280px]">
                {/* LCD BEZEL GLOSS */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-lg" />
                
                {/* SCREEN */}
                <div className="relative bg-[#7ec850] shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] rounded-sm p-1.5 overflow-hidden min-h-[80px] flex items-center justify-center">
                    
                    {/* Mode: TEXT VIEW */}
                    {mode === 'text' && (
                        <div className="w-full h-full flex flex-col gap-0.5 font-mono text-xs leading-none">
                            {/* Simulated Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-[length:3px_3px] pointer-events-none" />
                            
                            <div className="z-10 w-full text-center text-black/85 font-bold tracking-widest drop-shadow-[1px_1px_0_rgba(255,255,255,0.2)]">
                                {segment.displayContent || "SYSTEM READY..."}
                            </div>
                        </div>
                    )}

                    {/* Mode: CUSTOM CHAR BUILDER (5x8 GRID) */}
                    {mode === 'pixel' && (
                        <div className="flex gap-4 items-center">
                            {/* The Grid Editor */}
                            <div className="grid grid-cols-5 gap-[1px] bg-black/10 p-[1px] border border-black/20 shadow-sm">
                                {customCharGrid.map((isOn, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => toggleLcdPixel(idx)}
                                        className={cn(
                                            "w-3 h-3 transition-colors duration-75",
                                            isOn ? "bg-black" : "bg-[#7ec850] hover:bg-black/20"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Preview & Controls */}
                            <div className="flex flex-col gap-2">
                                <div className="text-[7px] font-black uppercase text-black/50 tracking-widest text-center">PREVIEW</div>
                                <div className="w-6 h-8 bg-[#7ec850] border border-black/10 flex items-center justify-center">
                                    {/* Mini Preview */}
                                    <div className="grid grid-cols-5 gap-[0.5px]">
                                        {customCharGrid.map((isOn, i) => (
                                            <div key={i} className={cn("w-[2px] h-[2px]", isOn ? "bg-black" : "bg-transparent")} />
                                        ))}
                                    </div>
                                </div>
                                <button onClick={clearLcdGrid} className="text-[7px] font-bold text-red-700 uppercase hover:underline">Clear</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ================= OLED RENDERER ================= */}
        {isOled && (
            <div className="relative p-1 bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl w-full max-w-[280px]">
                {/* OLED GLOW */}
                <div className="absolute -inset-[1px] bg-blue-500/20 blur-md rounded-xl -z-10 opacity-50" />

                {/* SCREEN CONTAINER */}
                <div className="relative w-full aspect-[2/1] bg-black rounded-lg overflow-hidden border border-white/5">
                    
                    {/* Canvas for Drawing (Always visible to keep drawing state, but interactive only in pixel mode) */}
                    <canvas
                        ref={canvasRef}
                        width={128}
                        height={64}
                        className={cn(
                            "w-full h-full rendering-pixelated",
                            mode === 'pixel' ? "cursor-crosshair opacity-100" : "opacity-30 pointer-events-none"
                        )}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />

                    {/* Text Overlay Mode */}
                    {mode === 'text' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-blue-400 font-mono text-sm text-center leading-relaxed px-4">
                                <span className="block text-[8px] opacity-50 mb-1 tracking-[0.2em] uppercase">Status_Log</span>
                                <span className="font-bold text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                                    {segment.displayContent || "NO SIGNAL"}
                                </span>
                            </div>
                            {/* Scanlines */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px] opacity-30" />
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* --- CONTROL BAR --- */}
      <div className="bg-secondary/5 p-2 rounded-lg border border-border/50 flex flex-col gap-2">
         {mode === 'text' ? (
             <div className="flex gap-2 items-center">
                <Edit3 size={14} className="text-muted-foreground ml-1" />
                <Input 
                    placeholder="Send string data..." 
                    className="h-8 text-[10px] bg-transparent border-none shadow-none focus-visible:ring-0 px-2 font-mono"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10 rounded-md" onClick={handleSendText}>
                    <Send size={14} />
                </Button>
             </div>
         ) : (
             <div className="flex justify-between items-center px-1">
                 <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Binary size={10} /> 
                    {isOled ? "Buffer Editor (1KB)" : "CGRAM Editor (5x8)"}
                 </span>
                 
                 <div className="flex gap-2">
                    {isOled && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[8px] gap-1 hover:text-destructive" onClick={clearCanvas}>
                            <Trash2 size={10} /> Clear
                        </Button>
                    )}
                    <Button size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-wider bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                        <Download size={10} className="mr-1" /> Upload
                    </Button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
