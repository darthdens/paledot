import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';
import type { ScaleLevel } from '../types';

// Music configuration by scale level
// Each level has a base drone frequency/character + optional overlay
interface MusicConfig {
  // Base frequencies for synth drone (Hz)
  baseFreq: number;
  harmonic: number;
  // Character parameters
  filterFreq: number;
  filterQ: number;
  // Volume
  gain: number;
  // Modulation (LFO)
  lfoRate: number;
  lfoDepth: number;
  // Sub bass
  subFreq: number;
  subGain: number;
  // High shimmer
  shimmerFreq: number;
  shimmerGain: number;
}

const MUSIC_CONFIGS: Record<ScaleLevel, MusicConfig> = {
  // Earth/Moon - Peaceful, intimate, soft pads
  earth: {
    baseFreq: 196, // G3
    harmonic: 392, // G4
    filterFreq: 800,
    filterQ: 0.5,
    gain: 0.12,
    lfoRate: 0.05,
    lfoDepth: 10,
    subFreq: 65.41, // C2
    subGain: 0.06,
    shimmerFreq: 1568, // G6
    shimmerGain: 0.015,
  },
  // Solar System - Vast, majestic, slightly brighter
  solarSystem: {
    baseFreq: 174.61, // F3
    harmonic: 349.23, // F4
    filterFreq: 600,
    filterQ: 0.7,
    gain: 0.14,
    lfoRate: 0.03,
    lfoDepth: 15,
    subFreq: 58.27, // Bb1
    subGain: 0.08,
    shimmerFreq: 1396.91, // F6
    shimmerGain: 0.02,
  },
  // Stellar - Ethereal, mysterious, with distant twinkling
  stellar: {
    baseFreq: 164.81, // E3
    harmonic: 329.63, // E4
    filterFreq: 500,
    filterQ: 1,
    gain: 0.15,
    lfoRate: 0.02,
    lfoDepth: 20,
    subFreq: 55, // A1
    subGain: 0.1,
    shimmerFreq: 1318.51, // E6
    shimmerGain: 0.025,
  },
  // Milky Way - Epic, vast, cosmic wonder
  milkyWay: {
    baseFreq: 146.83, // D3
    harmonic: 293.66, // D4
    filterFreq: 400,
    filterQ: 1.5,
    gain: 0.16,
    lfoRate: 0.015,
    lfoDepth: 25,
    subFreq: 49, // G1
    subGain: 0.12,
    shimmerFreq: 1174.66, // D6
    shimmerGain: 0.03,
  },
  // Local Group - Vast expanse, isolated, contemplative
  localGroup: {
    baseFreq: 138.59, // C#3
    harmonic: 277.18, // C#4
    filterFreq: 350,
    filterQ: 2,
    gain: 0.17,
    lfoRate: 0.01,
    lfoDepth: 30,
    subFreq: 46.25, // F#1
    subGain: 0.14,
    shimmerFreq: 1108.73, // C#6
    shimmerGain: 0.03,
  },
  // Virgo Supercluster - Cosmic web emerging, dense structures
  virgoSupercluster: {
    baseFreq: 130.81, // C3
    harmonic: 261.63, // C4
    filterFreq: 300,
    filterQ: 2.5,
    gain: 0.18,
    lfoRate: 0.008,
    lfoDepth: 35,
    subFreq: 43.65, // F1
    subGain: 0.15,
    shimmerFreq: 1046.5, // C6
    shimmerGain: 0.035,
  },
  // Laniakea - Dramatic, flowing with cosmic currents
  laniakea: {
    baseFreq: 123.47, // B2
    harmonic: 246.94, // B3
    filterFreq: 250,
    filterQ: 3,
    gain: 0.19,
    lfoRate: 0.006,
    lfoDepth: 40,
    subFreq: 41.2, // E1
    subGain: 0.16,
    shimmerFreq: 987.77, // B5
    shimmerGain: 0.04,
  },
  // Universe - Profound, infinite, awe-inspiring
  universe: {
    baseFreq: 116.54, // Bb2
    harmonic: 233.08, // Bb3
    filterFreq: 200,
    filterQ: 4,
    gain: 0.2,
    lfoRate: 0.004,
    lfoDepth: 50,
    subFreq: 38.89, // Eb1
    subGain: 0.18,
    shimmerFreq: 932.33, // Bb5
    shimmerGain: 0.045,
  },
};

// Transition duration in seconds
const TRANSITION_DURATION = 3;

export const useAmbientMusic = () => {
  const isMuted = useCosmosStore((s) => s.isMuted);
  const volume = useCosmosStore((s) => s.volume);
  const currentScale = useCosmosStore((s) => s.currentScale);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);

  // Oscillator references for crossfading
  const oscillatorsRef = useRef<{
    base: OscillatorNode | null;
    harmonic: OscillatorNode | null;
    sub: OscillatorNode | null;
    shimmer: OscillatorNode | null;
    lfo: OscillatorNode | null;
    baseGain: GainNode | null;
    harmonicGain: GainNode | null;
    subGain: GainNode | null;
    shimmerGain: GainNode | null;
    filter: BiquadFilterNode | null;
    lfoGain: GainNode | null;
  }>({
    base: null,
    harmonic: null,
    sub: null,
    shimmer: null,
    lfo: null,
    baseGain: null,
    harmonicGain: null,
    subGain: null,
    shimmerGain: null,
    filter: null,
    lfoGain: null,
  });

  const currentConfigRef = useRef<MusicConfig | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Master gain for global volume control
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    return ctx;
  }, []);

  // Create and start oscillators for a given config
  const createSynthVoice = useCallback((config: MusicConfig) => {
    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const oscs = oscillatorsRef.current;
    const now = ctx.currentTime;

    // Clean up existing oscillators
    if (oscs.base) {
      try { oscs.base.stop(); } catch {}
    }
    if (oscs.harmonic) {
      try { oscs.harmonic.stop(); } catch {}
    }
    if (oscs.sub) {
      try { oscs.sub.stop(); } catch {}
    }
    if (oscs.shimmer) {
      try { oscs.shimmer.stop(); } catch {}
    }
    if (oscs.lfo) {
      try { oscs.lfo.stop(); } catch {}
    }

    // Create filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.filterFreq, now);
    filter.Q.setValueAtTime(config.filterQ, now);

    // Create gains for mixing
    const baseGain = ctx.createGain();
    baseGain.gain.setValueAtTime(config.gain * 0.6, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(config.gain * 0.3, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(config.subGain, now);

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(config.shimmerGain, now);

    // LFO for filter modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(config.lfoRate, now);
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(config.lfoDepth, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Base oscillator (triangle for warm tone)
    const base = ctx.createOscillator();
    base.type = 'triangle';
    base.frequency.setValueAtTime(config.baseFreq, now);
    base.connect(baseGain);
    baseGain.connect(filter);

    // Harmonic oscillator (sine for purity)
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(config.harmonic, now);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);

    // Sub bass (sine)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(config.subFreq, now);
    sub.connect(subGain);
    subGain.connect(masterGainRef.current);

    // Shimmer (triangle, high frequency)
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(config.shimmerFreq, now);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(filter);

    // Connect filter to master
    filter.connect(masterGainRef.current);

    // Start all oscillators
    base.start();
    harmonic.start();
    sub.start();
    shimmer.start();
    lfo.start();

    // Store references
    oscillatorsRef.current = {
      base,
      harmonic,
      sub,
      shimmer,
      lfo,
      baseGain,
      harmonicGain,
      subGain,
      shimmerGain,
      filter,
      lfoGain,
    };

    currentConfigRef.current = config;
  }, []);

  // Smoothly transition to a new config
  const transitionToConfig = useCallback((config: MusicConfig) => {
    const ctx = audioContextRef.current;
    const oscs = oscillatorsRef.current;
    if (!ctx || !oscs.base) {
      // No existing synth, create new one
      createSynthVoice(config);
      return;
    }

    const now = ctx.currentTime;
    const end = now + TRANSITION_DURATION;

    // Transition frequencies
    oscs.base?.frequency.linearRampToValueAtTime(config.baseFreq, end);
    oscs.harmonic?.frequency.linearRampToValueAtTime(config.harmonic, end);
    oscs.sub?.frequency.linearRampToValueAtTime(config.subFreq, end);
    oscs.shimmer?.frequency.linearRampToValueAtTime(config.shimmerFreq, end);
    oscs.lfo?.frequency.linearRampToValueAtTime(config.lfoRate, end);

    // Transition gains
    oscs.baseGain?.gain.linearRampToValueAtTime(config.gain * 0.6, end);
    oscs.harmonicGain?.gain.linearRampToValueAtTime(config.gain * 0.3, end);
    oscs.subGain?.gain.linearRampToValueAtTime(config.subGain, end);
    oscs.shimmerGain?.gain.linearRampToValueAtTime(config.shimmerGain, end);
    oscs.lfoGain?.gain.linearRampToValueAtTime(config.lfoDepth, end);

    // Transition filter
    oscs.filter?.frequency.linearRampToValueAtTime(config.filterFreq, end);
    oscs.filter?.Q.linearRampToValueAtTime(config.filterQ, end);

    currentConfigRef.current = config;
  }, [createSynthVoice]);

  // Start playing ambient music
  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;

    const ctx = initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isPlayingRef.current = true;

    const config = MUSIC_CONFIGS[currentScale];
    createSynthVoice(config);

    // Fade in master volume
    if (masterGainRef.current) {
      const now = ctx.currentTime;
      masterGainRef.current.gain.setValueAtTime(0, now);
      masterGainRef.current.gain.linearRampToValueAtTime(volume * 0.5, now + 2);
    }
  }, [initAudio, createSynthVoice, currentScale, volume]);

  // Stop ambient music
  const stopMusic = useCallback(() => {
    if (!isPlayingRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx && masterGainRef.current) {
      const now = ctx.currentTime;
      masterGainRef.current.gain.linearRampToValueAtTime(0, now + 1);
    }

    isPlayingRef.current = false;

    // Clean up oscillators after fade out
    setTimeout(() => {
      const oscs = oscillatorsRef.current;
      try { oscs.base?.stop(); } catch {}
      try { oscs.harmonic?.stop(); } catch {}
      try { oscs.sub?.stop(); } catch {}
      try { oscs.shimmer?.stop(); } catch {}
      try { oscs.lfo?.stop(); } catch {}
      oscillatorsRef.current = {
        base: null,
        harmonic: null,
        sub: null,
        shimmer: null,
        lfo: null,
        baseGain: null,
        harmonicGain: null,
        subGain: null,
        shimmerGain: null,
        filter: null,
        lfoGain: null,
      };
    }, 1500);
  }, []);

  // Handle mute/unmute
  useEffect(() => {
    if (isMuted) {
      stopMusic();
    }
  }, [isMuted, stopMusic]);

  // Handle volume changes
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current && !isMuted && isPlayingRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.linearRampToValueAtTime(volume * 0.5, now + 0.3);
    }
  }, [volume, isMuted]);

  // Handle scale changes
  useEffect(() => {
    if (!isPlayingRef.current || isMuted) return;

    const config = MUSIC_CONFIGS[currentScale];
    transitionToConfig(config);
  }, [currentScale, transitionToConfig, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      audioContextRef.current?.close();
    };
  }, [stopMusic]);

  return {
    startMusic,
    stopMusic,
    isPlaying: isPlayingRef.current,
  };
};
