
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType, GroupType } from '../../types/index';
import { 
  Sun, Moon, Plus, Settings as SettingsIcon, Volume2, 
  Music, VolumeX, Network, Terminal, Shield, ShieldAlert,
  ChevronRight, LayoutGrid, Radio, Zap, Sparkles
} from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-white dark:bg-[#0d0d0d] border-l-4 border-primary z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-black p-8 flex justify-between items-center shadow-xl border-b border-primary/20">
              <div className="flex flex-col">
                <h2 className="text-primary font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
                   <SettingsIcon size={24} /> System OS
                </h2>
                <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] mt-1">Advanced Node Controller</span>
              </div>
              <button 
                onClick={onClose} 
                className="text-primary hover:text-white transition-colors p-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-24">
              
              {/* UI Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <LayoutGrid size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Environment</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      settings.theme === 'light' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-100 dark:border-white/5 text-gray-400'
                    }`}
                  >
                    <Sun size={18} /> Light
                  </button>
                  <button 
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                      settings.theme === 'dark' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-100 dark:border-white/5 text-gray-400'
                    }`}
                  >
                    <Moon size={18} /> Dark
                  </button>
                </div>
              </section>

              {/* Graphics Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Visual Engine</h3>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-primary/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-black dark:text-white font-black uppercase tracking-widest">Motion FX</span>
                    <span className="text-[8px] text-gray-500 uppercase font-black opacity-60">System-wide animations</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.animations}
                      onChange={e => updateSettings({ animations: e.target.checked })}
                    />
                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </section>

              {/* Node Assignment */}
              <section className="space-y-6 bg-gray-50 dark:bg-white/5 p-6 rounded-[30px] border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2 text-primary">
                  <Plus size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Module Deployment</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Friendly Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Living Room AC" 
                      value={newSegment.name}
                      onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                      className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Pin Mapping</label>
                      <input 
                        type="number" 
                        value={newSegment.gpio || ""}
                        onChange={e => setNewSegment({...newSegment, gpio: parseInt(e.target.value) || 0})}
                        className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Logic Class</label>
                      <select 
                        value={newSegment.groupType}
                        onChange={e => setNewSegment({...newSegment, groupType: e.target.value as GroupType})}
                        className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all dark:text-white appearance-none"
                      >
                        <option value="custom">IO Controller</option>
                        <option value="input">Sensor Input</option>
                        <option value="weather">Environmental</option>
                        <option value="register">8-Bit Bus</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Control Surface</label>
                    <select 
                      value={newSegment.segType}
                      onChange={e => setNewSegment({...newSegment, segType: e.target.value as SegmentType})}
                      className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3.5 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="All">Hybrid Logic</option>
                      <option value="PWM">Variable PWM</option>
                      <option value="Digital">Binary Relay</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleAdd}
                    className="w-full bg-black text-primary font-black py-4 rounded-xl text-xs hover:bg-primary hover:text-black transition-all uppercase tracking-[0.2em] shadow-xl border border-primary/30 flex items-center justify-center gap-2"
                  >
                    Deploy to Board <Plus size={14} />
                  </button>
                </div>
              </section>

              {/* Communication Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <Radio size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Communication</h3>
                </div>
                
                <div className="space-y-5">
                   <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-1">Device Hostname</label>
                    <div className="flex items-center gap-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 px-4 rounded-xl focus-within:border-primary transition-all group">
                      <span className="text-primary font-black text-[10px] opacity-40 group-focus-within:opacity-100">{settings.useSsl ? 'wss://' : 'ws://'}</span>
                      <input 
                        type="text" 
                        value={settings.domain}
                        onChange={e => updateSettings({ domain: e.target.value })}
                        className="flex-1 bg-transparent py-4 text-xs font-black outline-none dark:text-white tracking-widest"
                      />
                      <span className="text-gray-400 font-black text-[10px]">.local</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-primary/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-black dark:text-white font-black uppercase tracking-widest">WSS Sync</span>
                      <span className="text-[8px] text-gray-500 uppercase font-black opacity-60">Secure Transport</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.useSsl}
                        onChange={e => updateSettings({ useSsl: e.target.checked })}
                      />
                      <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Audio Engine */}
              <section className="space-y-6 pb-8">
                <div className="flex items-center gap-2 text-primary">
                  <Volume2 size={16} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Aural Feedback</h3>
                </div>
                
                <div className="p-6 bg-black rounded-[30px] border border-primary/20 space-y-6 shadow-2xl">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-primary font-black uppercase tracking-widest">Ambient HUD</span>
                        <span className="text-[8px] text-gray-500 uppercase font-black">Dynamic Background</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ bgMusic: !settings.bgMusic })}
                        className={`p-4 rounded-2xl transition-all ${settings.bgMusic ? 'bg-primary text-black shadow-[0_0_20px_rgba(218,165,32,0.4)]' : 'bg-white/5 text-gray-600 border border-white/5'}`}
                      >
                        {settings.bgMusic ? <Music size={20} className="pulse-gold" /> : <VolumeX size={20} />}
                      </button>
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Output Volume</span>
                       <span className="text-[11px] font-black text-primary">{settings.volume}%</span>
                     </div>
                     <input 
                      type="range"
                      min="0" max="100"
                      value={settings.volume}
                      onChange={e => updateSettings({ volume: parseInt(e.target.value) })}
                      className="w-full"
                     />
                   </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
