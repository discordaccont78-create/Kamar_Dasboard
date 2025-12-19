
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType, GroupType } from '../../types/index';
import { MUSIC_TRACKS } from '../../app/page';
import { 
  Sun, Moon, Plus, Settings as SettingsIcon, Volume2, 
  Terminal, ChevronRight, LayoutGrid, Radio, Sparkles,
  SkipForward, SkipBack, Play, Pause
} from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MotionDiv = motion.div as any;

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { addSegment } = useSegments();
  const [newSegment, setNewSegment] = useState({ 
    gpio: 0, 
    segType: 'All' as SegmentType, 
    groupType: 'custom' as GroupType,
    name: '' 
  });

  const handleAdd = () => {
    if (newSegment.name.trim() === "") return;
    
    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      group: newSegment.name,
      groupType: newSegment.groupType,
      segType: newSegment.segType,
      gpio: newSegment.gpio,
      is_led_on: 'off',
      val_of_slide: 0,
      ...(newSegment.groupType === 'register' ? { regBitIndex: 0 } : {}),
      ...(newSegment.groupType === 'weather' ? { dhtPin: newSegment.gpio } : {}),
    });
    setNewSegment({ gpio: 0, segType: 'All', groupType: 'custom', name: '' });
  };

  const handleNextTrack = () => {
    const nextIdx = (settings.currentTrackIndex + 1) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: nextIdx });
  };

  const handlePrevTrack = () => {
    const prevIdx = (settings.currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    updateSettings({ currentTrackIndex: prevIdx });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <MotionDiv 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-background-light dark:bg-[#0d0d0d] border-l-4 border-primary z-[70] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-black p-8 flex justify-between items-center border-b-4 border-primary/30 shadow-2xl">
              <div className="flex flex-col">
                <h2 className="text-primary font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
                   <SettingsIcon size={24} /> System Settings
                </h2>
                <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] mt-1">v3.1 Configuration Interface</span>
              </div>
              <button 
                onClick={onClose} 
                className="text-primary hover:text-white transition-colors p-2 rounded-chip bg-primary/10 border border-primary/30"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="container flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
              <div className="sub-container bg-white dark:bg-white/5 p-5 rounded-bevel border-2 border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <LayoutGrid size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Environment UI</h3>
                </div>
                <div className="sub-sub-container grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex items-center justify-center gap-3 py-4 rounded-chip border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      settings.theme === 'light' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-100 dark:border-white/5 text-gray-400'
                    }`}
                  >
                    <Sun size={18} /> Light
                  </button>
                  <button 
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex items-center justify-center gap-3 py-4 rounded-chip border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      settings.theme === 'dark' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-100 dark:border-white/5 text-gray-400'
                    }`}
                  >
                    <Moon size={18} /> Dark
                  </button>
                </div>
              </div>

              <div className="sub-container bg-white dark:bg-white/5 p-6 rounded-bevel border-2 border-gray-100 dark:border-white/10 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Plus size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Add New Segment</h3>
                </div>
                <div className="sub-sub-container space-y-5">
                  <div className="field-group">
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5 ml-1">group-name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Segment Label..." 
                      value={newSegment.name}
                      onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-chip text-xs font-bold focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="input-row grid grid-cols-2 gap-4">
                    <div className="field-group">
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5 ml-1">pin-number</label>
                      <input 
                        type="number" 
                        value={newSegment.gpio || ""}
                        onChange={e => setNewSegment({...newSegment, gpio: parseInt(e.target.value) || 0})}
                        className="w-full bg-gray-50 dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-chip text-xs font-bold focus:border-primary outline-none transition-all dark:text-white"
                      />
                    </div>
                    <div className="field-group">
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5 ml-1">hardware-logic</label>
                      <select 
                        value={newSegment.groupType}
                        onChange={e => setNewSegment({...newSegment, groupType: e.target.value as GroupType})}
                        className="w-full bg-gray-50 dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-chip text-xs font-bold focus:border-primary outline-none transition-all dark:text-white appearance-none"
                      >
                        <option value="custom">IO Port</option>
                        <option value="input">Sensor Link</option>
                        <option value="weather">Weather Sensor</option>
                        <option value="register">8-Bit Link</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1.5 ml-1">type-of-segment</label>
                    <select 
                      value={newSegment.segType}
                      onChange={e => setNewSegment({...newSegment, segType: e.target.value as SegmentType})}
                      className="w-full bg-gray-50 dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-chip text-xs font-bold focus:border-primary outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="All">Hybrid Control</option>
                      <option value="Digital">On / Off Only</option>
                      <option value="PWM">PWM Slider Only</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAdd}
                    className="w-full bg-black text-primary font-black py-4 rounded-chip text-xs hover:bg-primary hover:text-black transition-all uppercase tracking-[0.2em] shadow-xl border-2 border-primary/30 flex items-center justify-center gap-2 mt-2"
                  >
                    Deploy to Board <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="sub-container bg-black p-6 rounded-bevel border-2 border-primary/30 space-y-6 shadow-xl">
                <div className="flex items-center gap-2 text-primary">
                  <Volume2 size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Audio Engine</h3>
                </div>
                <div className="sub-sub-container space-y-6">
                   <div className="player-wrapper bg-white/5 p-5 rounded-chip border border-white/5 flex flex-col gap-5">
                      <div className="track-info flex flex-col items-center text-center">
                        <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.5em] mb-1">Now Streaming</span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest truncate w-full">
                          {MUSIC_TRACKS[settings.currentTrackIndex].title}
                        </span>
                      </div>
                      <div className="controls-row flex items-center justify-center gap-6">
                        <button onClick={handlePrevTrack} className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-primary transition-all active:scale-90"><SkipBack size={18} /></button>
                        <button 
                          onClick={() => updateSettings({ bgMusic: !settings.bgMusic })}
                          className={`p-5 rounded-full transition-all active:scale-95 shadow-2xl ${settings.bgMusic ? 'bg-primary text-black' : 'bg-white/10 text-primary'}`}
                        >
                          {settings.bgMusic ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="translate-x-0.5" />}
                        </button>
                        <button onClick={handleNextTrack} className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-primary transition-all active:scale-90"><SkipForward size={18} /></button>
                      </div>
                   </div>
                   <div className="volume-control space-y-3 px-1">
                     <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Master Gain</span>
                       <span className="text-[11px] font-black text-primary">{settings.volume}%</span>
                     </div>
                     <input type="range" min="0" max="100" value={settings.volume} onChange={e => updateSettings({ volume: parseInt(e.target.value) })} className="w-full" />
                   </div>
                </div>
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};
