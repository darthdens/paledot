import { useRef, useEffect, useCallback } from "react";

interface VinylAudioOptions {
  isPlaying: boolean;
  volume: number; // 0-100
}

export const useVinylAudio = ({ isPlaying, volume }: VinylAudioOptions) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const crackleIntervalRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      isInitializedRef.current = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }, []);

  // Play a single crackle/pop sound
  const playCrackle = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    // Create noise buffer for crackle
    const bufferSize = ctx.sampleRate * 0.02; // 20ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise-like crackle
    for (let i = 0; i < bufferSize; i++) {
      // Random noise with decay envelope
      const envelope = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * envelope * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Create a bandpass filter for more realistic crackle
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000 + Math.random() * 3000;
    filter.Q.value = 1;

    // Connect nodes
    source.connect(filter);
    filter.connect(gain);

    source.start();
  }, []);

  // Play a pop sound (deeper, louder)
  const playPop = useCallback(() => {
    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    const bufferSize = ctx.sampleRate * 0.05; // 50ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pop sound
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 50);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low-pass filter for deeper sound
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);

    source.start();
  }, []);

  // Start continuous vinyl crackle ambient
  const startCrackle = useCallback(() => {
    if (crackleIntervalRef.current) return;

    const scheduleCrackle = () => {
      // Random interval between crackles (50-200ms)
      const interval = 50 + Math.random() * 150;
      
      crackleIntervalRef.current = window.setTimeout(() => {
        // 80% chance of small crackle, 20% chance of pop
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

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      // Scale volume: 0-100 -> 0-0.15 (keep crackle subtle)
      gainNodeRef.current.gain.value = (volume / 100) * 0.15;
    }
  }, [volume]);

  // Handle play/stop
  useEffect(() => {
    if (isPlaying) {
      initAudio();
      
      // Resume audio context if suspended
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
      
      startCrackle();
    } else {
      stopCrackle();
    }

    return () => {
      stopCrackle();
    };
  }, [isPlaying, initAudio, startCrackle, stopCrackle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCrackle();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCrackle]);

  return { initAudio };
};
