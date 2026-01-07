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
  const musicGainRef = useRef<GainNode | null>(null);
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
      
      // Music gain node
      musicGainRef.current = audioContextRef.current.createGain();
      musicGainRef.current.connect(audioContextRef.current.destination);
      
      isInitializedRef.current = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }, []);

  // Play a single crackle/pop sound
  const playCrackle = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = crackleGainRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const envelope = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * envelope * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000 + Math.random() * 3000;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    source.start();
  }, []);

  const playPop = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = crackleGainRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 50);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);
    source.start();
  }, []);

  const startCrackle = useCallback(() => {
    if (crackleIntervalRef.current) return;

    const scheduleCrackle = () => {
      const interval = 50 + Math.random() * 150;
      
      crackleIntervalRef.current = window.setTimeout(() => {
        if (Math.random() < 0.8) {
          playCrackle();
        } else {
          playPop();
        }
        
        if (crackleIntervalRef.current) {
          scheduleCrackle();
        }
      }, interval);
    };

    scheduleCrackle();
  }, [playCrackle, playPop]);

  const stopCrackle = useCallback(() => {
    if (crackleIntervalRef.current) {
      clearTimeout(crackleIntervalRef.current);
      crackleIntervalRef.current = null;
    }
  }, []);

  // Music playback
  const startMusic = useCallback(() => {
    if (!trackUrl) return;
    
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = true;
    }
    
    if (audioElementRef.current.src !== trackUrl) {
      audioElementRef.current.src = trackUrl;
    }
    
    audioElementRef.current.volume = volume / 100;
    audioElementRef.current.play().catch(console.warn);
  }, [trackUrl, volume]);

  const stopMusic = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  }, []);

  // Update volume
  useEffect(() => {
    if (crackleGainRef.current) {
      crackleGainRef.current.gain.value = (volume / 100) * 0.12;
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
      startMusic();
    } else {
      stopCrackle();
      stopMusic();
    }

    return () => {
      stopCrackle();
    };
  }, [isPlaying, initAudio, startCrackle, stopCrackle, startMusic, stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCrackle();
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCrackle, stopMusic]);

  return { initAudio };
};
