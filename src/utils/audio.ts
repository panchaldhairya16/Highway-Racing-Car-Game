/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;
  private currentBeat: number = 0;

  // Initialize context on first user gesture
  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopEngine();
      this.stopMusic();
    } else {
      // Resume if needed
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  }

  getMuted() {
    return this.isMuted;
  }

  startEngine() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.engineOsc) return; // Already running

    try {
      // Main deep rumble engine
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      // Sub harmonic for meatiness
      this.subOsc = this.ctx.createOscillator();

      this.engineOsc.type = 'sawtooth';
      this.subOsc.type = 'triangle';

      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.subOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      // Low-pass filter to sound like an engine block
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      this.subOsc.connect(filter);

      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.start();
      this.subOsc.start();
    } catch (e) {
      console.error('Failed to start audio engine', e);
    }
  }

  updateEngine(speedPercent: number) {
    if (this.isMuted || !this.ctx) return;
    if (!this.engineOsc || !this.subOsc) {
      this.startEngine();
      return;
    }

    const now = this.ctx.currentTime;
    // Map speed percentage (0 to 1) to frequency (45Hz to 120Hz)
    const engineFreq = 45 + speedPercent * 95;
    const subFreq = engineFreq / 2;

    this.engineOsc.frequency.setTargetAtTime(engineFreq, now, 0.1);
    this.subOsc.frequency.setTargetAtTime(subFreq, now, 0.1);

    // Engine volume modulates slightly with speed to feel dynamic
    if (this.engineGain) {
      const volume = 0.05 + speedPercent * 0.05;
      this.engineGain.gain.setTargetAtTime(volume, now, 0.1);
    }
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
    if (this.subOsc) {
      try {
        this.subOsc.stop();
        this.subOsc.disconnect();
      } catch (e) {}
      this.subOsc = null;
    }
    this.engineGain = null;
  }

  playCoin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Arpeggio sound: E5 then B5
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(987.77, now + 0.08); // B5

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playNitro() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.8);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  playShield() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playRepair() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc2.type = 'sine';

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.24); // C5

      osc2.frequency.setValueAtTime(523.25, now);
      osc2.frequency.setValueAtTime(659.25, now + 0.08);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  playCrash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Synthesize noise for explosion
      const bufferSize = this.ctx.sampleRate * 1.2; // 1.2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // White/brown noise formula
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Simple 1-pole filter to convert white noise to brown noise (deeper)
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Amplify
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(20, now + 1.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 1.2);
    } catch (e) {}
  }

  playMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.currentBeat = 0;

    // Simple procedural retro-wave tracker
    // Schedules a bassline and drum at regular intervals (125 BPM -> 0.24s per 16th note)
    const tempo = 0.24; // 130 BPM-ish 
    
    // Bass notes sequence (Outrun retro pattern in Am / G / F / Em)
    const baseBass = [
      110.00, 110.00, 110.00, 110.00, // A2 (Am)
      98.00, 98.00, 98.00, 98.00,     // G2 (G)
      87.31, 87.31, 87.31, 87.31,     // F2 (F)
      82.41, 82.41, 98.00, 110.00     // E2 -> G2 -> A2
    ];

    const melody = [
      440.00, 0, 493.88, 523.25,
      0, 587.33, 523.25, 493.88,
      392.00, 0, 440.00, 493.88,
      0, 523.25, 493.88, 392.00
    ];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      
      const step = this.currentBeat % 16;
      const chordIndex = Math.floor(this.currentBeat / 4) % 4;
      const bassFreq = baseBass[this.currentBeat % baseBass.length];

      try {
        // --- 1. Synthesize Bass (Every 16th beat, driving sixteenths!) ---
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        
        // Add a bit of low pass
        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(180, now);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.012, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        bassOsc.start(now);
        bassOsc.stop(now + 0.19);

        // --- 2. Synthesize Retro Drum Beat (Kick on 1, 5, 9, 13; Snare on 5, 13) ---
        const subStep = step % 4; // 0, 1, 2, 3
        
        if (subStep === 0) {
          // Play Synth Kick Drum
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);

          kickOsc.frequency.setValueAtTime(120, now);
          kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

          kickGain.gain.setValueAtTime(0.09, now);
          kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

          kickOsc.start(now);
          kickOsc.stop(now + 0.15);
        }

        if (subStep === 2) {
          // Play Retro Hi-Hat (simple filtered noise burst)
          const hatSize = this.ctx.sampleRate * 0.05; // 50ms
          const hatBuffer = this.ctx.createBuffer(1, hatSize, this.ctx.sampleRate);
          const hatData = hatBuffer.getChannelData(0);
          for (let i = 0; i < hatSize; i++) {
            hatData[i] = Math.random() * 2 - 1;
          }
          const hatSource = this.ctx.createBufferSource();
          hatSource.buffer = hatBuffer;
          
          const hatFilter = this.ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(8000, now);

          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(0.015, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          hatSource.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(this.ctx.destination);

          hatSource.start(now);
          hatSource.stop(now + 0.05);
        }

        // --- 3. Simple Ambient Melody Hook ---
        const note = melody[step];
        if (note > 0 && Math.floor(this.currentBeat / 16) % 2 === 1) { // Only play melody every other 16-bar block to not be annoying
          const melOsc = this.ctx.createOscillator();
          const melGain = this.ctx.createGain();
          const delay = this.ctx.createDelay();
          const delayGain = this.ctx.createGain();
          
          melOsc.type = 'triangle';
          melOsc.connect(melGain);
          melGain.connect(this.ctx.destination);
          
          // Simple delay echo effect
          delay.delayTime.setValueAtTime(0.18, now);
          delayGain.gain.setValueAtTime(0.3, now);
          melGain.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(this.ctx.destination);

          melOsc.frequency.setValueAtTime(note, now);
          melGain.gain.setValueAtTime(0.015, now);
          melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

          melOsc.start(now);
          melOsc.stop(now + 0.35);
        }

      } catch (e) {
        console.error('Error in music scheduler step', e);
      }

      this.currentBeat = (this.currentBeat + 1) % 128; // loop sequence
    }, tempo * 1000);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const AudioSynth = new AudioSynthManager();
