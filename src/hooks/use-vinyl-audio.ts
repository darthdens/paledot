import { useRef, useEffect, useCallback } from "react";

interface VinylAudioOptions {
  isPlaying: boolean;
  volume: number; // 0-100
  trackUrl?: string;
}

export const useVinylAudio = ({ isPlaying, volume, trackUrl }: VinylAudioOptions) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const crackleIntervalRef = useRef<number | null>(null);
  const crackleGainRef = useRef<GainNode | null>(null);
  const crackleFadeTimeoutRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Crackle gain node
      crackleGainRef.current = audioContextRef.current.createGain();
      crackleGainRef.current.connect(audioContextRef.current.destination);
      
      isInitializedRef.current = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }, []);

  // Play a soft, smooth crackle
  const playSoftCrackle = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = crackleGainRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    // Longer, softer crackle
    const bufferSize = ctx.sampleRate * 0.008; // 8ms - shorter burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Softer noise with smooth envelope
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Smooth fade in and out
      const envelope = Math.sin(t * Math.PI) * 0.3;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Softer high-pass filter for subtle hiss
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000 + Math.random() * 2000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    source.start();
  }, []);

  // Occasional subtle pop
  const playSoftPop = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = crackleGainRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    const bufferSize = ctx.sampleRate * 0.015; // 15ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 80) * 0.4; // Softer, faster decay
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;

    source.connect(filter);
    filter.connect(gain);
    source.start();
  }, []);

  const stopCrackle = useCallback(() => {
    if (crackleIntervalRef.current) {
      clearTimeout(crackleIntervalRef.current);
      crackleIntervalRef.current = null;
    }
    if (crackleFadeTimeoutRef.current) {
      clearTimeout(crackleFadeTimeoutRef.current);
      crackleFadeTimeoutRef.current = null;
    }
  }, []);

  const startCrackle = useCallback(() => {
    if (crackleIntervalRef.current) return;

    // Reset gain to full when starting
    if (crackleGainRef.current) {
      crackleGainRef.current.gain.value = 0.06;
    }

    const scheduleCrackle = () => {
      // Much longer intervals for subtle ambient feel (200-600ms)
      const interval = 200 + Math.random() * 400;
      
      crackleIntervalRef.current = window.setTimeout(() => {
        // 90% chance of soft crackle, 10% chance of subtle pop
        if (Math.random() < 0.9) {
          playSoftCrackle();
        } else {
          playSoftPop();
        }
        
        if (crackleIntervalRef.current) {
          scheduleCrackle();
        }
      }, interval);
    };

    scheduleCrackle();

    // Fade out crackle after 3 seconds
    if (crackleFadeTimeoutRef.current) {
      clearTimeout(crackleFadeTimeoutRef.current);
    }
    crackleFadeTimeoutRef.current = window.setTimeout(() => {
      stopCrackle();
    }, 3000);
  }, [playSoftCrackle, playSoftPop, stopCrackle]);

  // Music playback (exposed so VinylPlayer can call it inside a user gesture)
  const playMusicNow = useCallback(() => {
    if (!trackUrl) return;

    if (!audioElementRef.current) {
      const el = new Audio();
      el.loop = true;
      el.preload = "auto";
      el.addEventListener("error", () => {
        // Helps pinpoint broken sources in the console
        console.warn("Audio element error:", el.error);
      });
      audioElementRef.current = el;
    }

    const el = audioElementRef.current;

    // Note: el.src becomes absolute after setting, so compare with endsWith
    if (!el.src || !el.src.endsWith(trackUrl)) {
      el.src = trackUrl;
      el.currentTime = 0;
      el.load();
    }

    el.volume = volume / 100;
    el.play().catch(console.warn);
  }, [trackUrl, volume]);

  const stopMusicNow = useCallback(() => {
    const el = audioElementRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  // Seek by delta seconds (positive = forward, negative = backward)
  const seekBy = useCallback((deltaSeconds: number) => {
    const el = audioElementRef.current;
    if (!el || !el.duration || isNaN(el.duration)) return;
    
    const newTime = Math.max(0, Math.min(el.duration, el.currentTime + deltaSeconds));
    el.currentTime = newTime;
  }, []);

  // Scratch sound effect for manual scrubbing
  const lastScratchTimeRef = useRef(0);
  const playScratchSound = useCallback((intensity: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Resume context if suspended
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // Throttle scratch sounds (min 30ms between)
    const now = Date.now();
    if (now - lastScratchTimeRef.current < 30) return;
    lastScratchTimeRef.current = now;
    
    // Create scratch noise buffer
    const duration = 0.05 + Math.abs(intensity) * 0.05; // 50-100ms based on intensity
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate scratchy vinyl noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Quick attack, medium decay envelope
      const envelope = Math.exp(-t * 8) * Math.min(t * 20, 1);
      // Mix of white noise and low frequency rumble
      const noise = (Math.random() * 2 - 1) * 0.6;
      const rumble = Math.sin(t * Math.PI * 80) * 0.4;
      data[i] = (noise + rumble) * envelope;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Bandpass filter for vinyl scratch character
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800 + Math.abs(intensity) * 400;
    filter.Q.value = 1.5;
    
    // Gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.min(0.3, Math.abs(intensity) * 0.15) * (volume / 100);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }, [volume]);

  // Get current time and duration for external use
  const getPlaybackInfo = useCallback(() => {
    const el = audioElementRef.current;
    if (!el) return { currentTime: 0, duration: 0 };
    return { 
      currentTime: el.currentTime || 0, 
      duration: el.duration || 0 
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (crackleGainRef.current) {
      // Very subtle crackle volume (0-0.06)
      crackleGainRef.current.gain.value = (volume / 100) * 0.06;
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle track change
  useEffect(() => {
    if (audioElementRef.current && trackUrl) {
      const wasPlaying = !audioElementRef.current.paused;
      audioElementRef.current.src = trackUrl;
      if (wasPlaying && isPlaying) {
        // may be blocked by autoplay rules, but once user started playback it will usually work
        audioElementRef.current.play().catch(console.warn);
      }
    }
  }, [trackUrl, isPlaying]);

  // Handle play/stop
  useEffect(() => {
    if (isPlaying) {
      initAudio();

      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      startCrackle();
      // Music is primarily started via playMusicNow() from a user gesture.
      // If already started, keep it going; if not, browser may block autoplay.
      playMusicNow();
    } else {
      stopCrackle();
      stopMusicNow();
    }

    return () => {
      stopCrackle();
    };
  }, [isPlaying, initAudio, startCrackle, stopCrackle, playMusicNow, stopMusicNow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCrackle();
      stopMusicNow();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCrackle, stopMusicNow]);

  return { initAudio, playMusicNow, stopMusicNow, seekBy, getPlaybackInfo, playScratchSound };
};
