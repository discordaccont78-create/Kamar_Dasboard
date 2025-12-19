
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType } from '../../types/index';
import { MUSIC_TRACKS } from '../../app/page';
import { 
  Sun, Moon, Plus, Settings as SettingsIcon, Volume2, 
  ChevronRight, LayoutGrid, Play, Pause
} from 'lucide-react';

interface SideMenuProps { isOpen: boolean; onClose: () => void; }
const MotionDiv = motion.div as any;

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const { addSegment } = useSegments();
  
  const [form, setForm] = useState({
    gpio: '',
    name: '',
    type: 'Digital' as SegmentType,
    group: ''
  });

  const handleAdd = () => {
    if (!form.gpio || !form.name) return;
    addSegment({
      num_of_node: Math.random().toString(36).substr(2, 9),
      name: form.name.trim(),
      group: form.group.trim() || "basic",
      groupType: 'custom',
      segType: form.type,
      gpio: parseInt(form.gpio),
      is_led_on: 'off',
      val_of_slide: 0,
    });
    setForm({ gpio: '', name: '', type: 'Digital', group: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" />
          <MotionDiv 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-background-light dark:bg-background-dark border-l-4 border-primary z-[70] shadow-2xl flex flex-col transition-colors duration-500"
          >
            <div className="bg-card-light dark:bg-card-dark p-8 flex justify-between items-center border-b-4 border-primary/30 shadow-2xl transition-colors duration-500">
              <div className="flex flex-col">
                <h2 className="text-primary font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
                   <SettingsIcon size={24} /> System Settings
                </h2>
                <span className="text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] mt-1">v3.1 Configuration Interface</span>
              </div>
              <button onClick={onClose} className="text-primary hover:scale-110 transition-transform p-2 rounded-chip bg-primary/10 border border-primary/30">
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="container flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
              
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-bevel border-2 border-gray-300 dark:border-[#2d2d2d] shadow-xl relative transition-colors duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 dark:text-white font-black text-[14px] uppercase tracking-[0.2em] flex-1 text-center">Output Segments</h3>
                  <SettingsIcon size={16} className="text-gray-400" />
                </div>
                <div className="h-0.5 w-full bg-primary/40 mb-6" />
                
                <div className="space-y-4">
                  <input 
                    type="number" 
                    placeholder="GPIO Pin" 
                    value={form.gpio}
                    onChange={e => setForm({...form, gpio: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333] p-4 rounded-chip text-xs font-bold outline-none focus:border-primary transition-all dark:text-primary placeholder:text-gray-400 dark:placeholder:text-primary/20" 
                  />
                  <input 
                    type="text" 
                    placeholder="Segment Name (e.g. Bedside Lamp)" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333] p-4 rounded-chip text-xs font-bold outline-none focus:border-primary transition-all dark:text-primary placeholder:text-gray-400 dark:placeholder:text-primary/20" 
                  />
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value as SegmentType})}
                    className="w-full bg-gray-100 dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333] p-4 rounded-chip text-xs font-bold outline-none focus:border-primary transition-all dark:text-primary"
                  >
                    <option value="Digital">Digital (On/Off)</option>
                    <option value="PWM">PWM (Intensity)</option>
                    <option value="All">Hybrid (Both)</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Group Name (optional)" 
                    value={form.group}
                    onChange={e => setForm({...form, group: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333] p-4 rounded-chip text-xs font-bold outline-none focus:border-primary transition-all dark:text-primary placeholder:text-gray-400 dark:placeholder:text-primary/20" 
                  />
                  
                  <button 
                    onClick={handleAdd}
                    className="w-full border-2 border-primary text-primary bg-transparent font-black py-4 rounded-chip text-xs hover:bg-primary hover:text-black transition-all uppercase tracking-[0.2em] mt-4"
                  >
                    Add Output Segment
                  </button>
                </div>
              </div>

              <div className="bg-card-light dark:bg-card-dark p-5 rounded-bevel border-2 border-gray-200 dark:border-white/5 shadow-sm transition-colors duration-500">
                <div className="flex items-center gap-2 text-primary mb-4 font-black text-[11px] uppercase tracking-[0.3em]">
                  <LayoutGrid size={16} /> ENVIRONMENT UI
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => updateSettings({ theme: 'light' })} className={`flex items-center justify-center gap-3 py-4 rounded-chip border-2 transition-all font-black text-[10px] uppercase tracking-widest ${settings.theme === 'light' ? 'bg-primary text-black border-primary' : 'bg-transparent border-gray-200 dark:border-white/5 text-gray-400'}`}>
                    <Sun size={18} /> LIGHT
                  </button>
                  <button onClick={() => updateSettings({ theme: 'dark' })} className={`flex items-center justify-center gap-3 py-4 rounded-chip border-2 transition-all font-black text-[10px] uppercase tracking-widest ${settings.theme === 'dark' ? 'bg-primary text-black border-primary' : 'bg-transparent border-gray-200 dark:border-white/5 text-gray-400'}`}>
                    <Moon size={18} /> DARK
                  </button>
                </div>
              </div>

              <div className="bg-card-light dark:bg-card-dark p-6 rounded-bevel border-2 border-gray-200 dark:border-white/5 space-y-6 shadow-xl transition-colors duration-500">
                <div className="flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
                  <Volume2 size={16} /> AUDIO ENGINE
                </div>
                <div className="player-wrapper bg-gray-100 dark:bg-black/20 p-5 rounded-chip border-2 border-gray-200 dark:border-white/5 flex flex-col gap-5">
                  <div className="track-info text-center">
                    <span className="text-[8px] text-gray-400 uppercase font-black tracking-[0.5em] mb-1">STATION ACTIVE</span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest block truncate">{MUSIC_TRACKS[settings.currentTrackIndex].title}</span>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => updateSettings({ bgMusic: !settings.bgMusic })} className={`p-5 rounded-full transition-all active:scale-95 shadow-2xl ${settings.bgMusic ? 'bg-primary text-black' : 'bg-gray-300 dark:bg-white/10 text-primary'}`}>
                      {settings.bgMusic ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="translate-x-0.5" />}
                    </button>
                  </div>
                  <input type="range" min="0" max="100" value={settings.volume} onChange={e => updateSettings({ volume: parseInt(e.target.value) })} className="w-full" />
                </div>
              </div>

            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};
