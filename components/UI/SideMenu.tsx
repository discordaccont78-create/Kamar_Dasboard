
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSegments } from '../../lib/store/segments';
import { useSettingsStore } from '../../lib/store/settings';
import { SegmentType, GroupType } from '../../types/index';
import { 
  Sun, Moon, Plus, Settings as SettingsIcon, Volume2, 
  Music, VolumeX, Network, Terminal, Shield, ShieldAlert
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

  const isHttps = typeof window !== 'undefined' && window.location.protocol.includes('https');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[450px] bg-white dark:bg-[#1a1a1a] border-l-4 border-primary z-50 shadow-2xl overflow-y-auto"
          >
            <div className="bg-primary p-8 flex justify-between items-center shadow-xl sticky top-0 z-10">
              <div className="flex flex-col">
                <h2 className="text-black font-black text-2xl uppercase tracking-tighter leading-none">Settings</h2>
                <span className="text-black/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">System Controller</span>
              </div>
              <button onClick={onClose} className="text-black hover:rotate-90 transition-transform p-2 bg-black/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 flex flex-col gap-10">
              {/* Theme Toggle */}
              <section className="flex flex-col gap-4">
                <h3 className="text-primary font-black text-xs flex items-center gap-2 uppercase tracking-[0.3em]">
                  UI Environment
                </h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase ${
                      settings.theme === 'light' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400'
                    }`}
                  >
                    <Sun size={20} /> Light Mode
                  </button>
                  <button 
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase ${
                      settings.theme === 'dark' ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400'
                    }`}
                  >
                    <Moon size={20} /> Dark Mode
                  </button>
                </div>
              </section>

              {/* Add Segment Section */}
              <section className="flex flex-col gap-5 border-2 border-gray-100 dark:border-white/10 p-6 rounded-[30px] bg-gray-50/50 dark:bg-black/20">
                <h3 className="text-primary font-black text-xs flex items-center gap-2 uppercase tracking-[0.3em]">
                  <Plus size={16} /> Assign Node
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Display Alias</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Master Bedroom Lamp" 
                      value={newSegment.name}
                      onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                      className="bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">GPIO Pin Index (0-39)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 2" 
                      value={newSegment.gpio || ""}
                      onChange={e => setNewSegment({...newSegment, gpio: parseInt(e.target.value) || 0})}
                      className="bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Logic Group</label>
                    <select 
                      value={newSegment.groupType}
                      onChange={e => setNewSegment({...newSegment, groupType: e.target.value as GroupType})}
                      className="bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm focus:border-primary outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="custom">Standard GPIO</option>
                      <option value="input">Input Sensor</option>
                      <option value="weather">Environmental Sensor</option>
                      <option value="register">Shift Register</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Control Modality</label>
                    <select 
                      value={newSegment.segType}
                      onChange={e => setNewSegment({...newSegment, segType: e.target.value as SegmentType})}
                      className="bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm focus:border-primary outline-none transition-all dark:text-white appearance-none"
                    >
                      <option value="All">Hybrid (Digital + PWM)</option>
                      <option value="PWM">Proportional (PWM)</option>
                      <option value="Digital">Binary (On/Off)</option>
                      <option value="Input-0-1">State Monitoring</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleAdd}
                    className="bg-black text-primary font-black py-4 rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] shadow-lg mt-2 border border-primary/20"
                  >
                    Deploy Node
                  </button>
                </div>
              </section>

              {/* General Settings Section */}
              <section className="flex flex-col gap-6">
                <h3 className="text-primary font-black text-xs flex items-center gap-2 uppercase tracking-[0.3em]">
                  <Network size={16} /> Infrastructure
                </h3>
                
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dashboard Title</label>
                    <input 
                      type="text" 
                      value={settings.title}
                      onChange={e => updateSettings({ title: e.target.value })}
                      className="bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm focus:border-primary outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">mDNS Local Address</label>
                    <div className="flex items-center gap-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 px-4 rounded-xl focus-within:border-primary transition-all">
                      <span className="text-gray-400 font-mono text-xs">{settings.useSsl ? 'wss://' : 'ws://'}</span>
                      <input 
                        type="text" 
                        value={settings.domain}
                        onChange={e => updateSettings({ domain: e.target.value.replace(/^(ws|wss):\/\//, '') })}
                        className="flex-1 bg-transparent py-3 text-sm outline-none dark:text-white font-mono"
                      />
                      <span className="text-gray-400 font-mono text-xs">.local</span>
                    </div>
                  </div>

                  {/* SSL Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-primary/10">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-black dark:text-white font-black uppercase tracking-wider">Secure WebSocket</span>
                        {isHttps && !settings.useSsl && <ShieldAlert size={12} className="text-red-500 animate-pulse" />}
                      </div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Use WSS (Port 443)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.useSsl}
                        onChange={e => updateSettings({ useSsl: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {isHttps && !settings.useSsl && (
                    <p className="text-[9px] text-red-500 font-bold uppercase leading-tight px-1">
                      Warning: Browsers block insecure WebSocket (WS) on HTTPS pages. Switch to WSS or load via HTTP.
                    </p>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-black dark:text-white font-black uppercase">UI Fluidity</span>
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Animations & Motion</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.animations}
                        onChange={e => updateSettings({ animations: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Audio & Music Control */}
              <section className="flex flex-col gap-6 mb-12">
                <h3 className="text-primary font-black text-xs flex items-center gap-2 uppercase tracking-[0.3em]">
                  <Terminal size={16} /> Audio Engine
                </h3>
                <div className="flex flex-col gap-6 p-6 bg-gray-50 dark:bg-white/5 rounded-[30px] border-2 border-gray-100 dark:border-white/10">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-black dark:text-white font-black uppercase">Ambient Music</span>
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Lo-fi Background</span>
                      </div>
                      <button 
                        onClick={() => updateSettings({ bgMusic: !settings.bgMusic })}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${settings.bgMusic ? 'bg-primary text-black' : 'bg-white dark:bg-black text-gray-500'}`}
                      >
                        {settings.bgMusic ? <Music size={22} className="animate-bounce" /> : <VolumeX size={22} />}
                      </button>
                   </div>

                   <div className="flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Master Amplitude</span>
                       <span className="text-xs font-black text-primary">{settings.volume}%</span>
                     </div>
                     <input 
                      type="range"
                      min="0" max="100"
                      value={settings.volume}
                      onChange={e => updateSettings({ volume: parseInt(e.target.value) })}
                      className="accent-primary h-2 rounded-lg cursor-pointer bg-gray-200 dark:bg-black"
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
