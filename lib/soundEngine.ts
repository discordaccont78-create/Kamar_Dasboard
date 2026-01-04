
/**
 * Procedural Sound Engine using Web Audio API
 * Generates UI sounds (clicks, blips, toggles) mathematically.
 * No external assets required.
 */

class SoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
  
    constructor() {
      // Lazy initialization to respect browser autoplay policies
    }
  
    private init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.3; // Default volume
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  
    public playClick() {
      this.init();
      if (!this.ctx || !this.masterGain) return;
  
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      // High pitched short tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
  
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }
  
    public playToggle(isOn: boolean) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
  
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      osc.type = 'triangle';
      
      if (isOn) {
        // Rising tone (Activation)
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.1);
      } else {
        // Falling tone (Deactivation)
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
      }
  
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }
  
    public playSuccess() {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      
      // Major Chord Arpeggio
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        const startTime = this.ctx!.currentTime + (i * 0.05);
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    }

    public playError() {
        this.init();
        if (!this.ctx || !this.masterGain) return;
    
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
    
        osc.connect(gain);
        gain.connect(this.masterGain);
    
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // New: Mechanical Keypress Sound
    public playType() {
        this.init();
        if (!this.ctx || !this.masterGain) return;
    
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
    
        osc.connect(gain);
        gain.connect(this.masterGain);
    
        // Very short, high pitched "tick" with slight random pitch for realism
        osc.type = 'triangle'; 
        const freq = 600 + Math.random() * 200;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // New: Soft Selection Blip (for colors/themes)
    public playBlip() {
        this.init();
        if (!this.ctx || !this.masterGain) return;
    
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
    
        osc.connect(gain);
        gain.connect(this.masterGain);
    
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // New: Menu Sweep (Accordion open/close)
    public playSweep() {
        this.init();
        if (!this.ctx || !this.masterGain) return;
    
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
    
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
    
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
  }
  
  export const soundEngine = new SoundEngine();
