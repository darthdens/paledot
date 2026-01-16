import { useEffect, useRef, useCallback } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';

// Single space ambient track for all scales
const SPACE_AMBIENT_TRACK = '/audio/space-ambient.mp3';

// Global audio instance to persist across component re-renders
let globalAudio: HTMLAudioElement | null = null;

export const useAmbientMusic = () => {
  const volume = useCosmosStore((s) => s.volume);
  const isPlaying = useCosmosStore((s) => s.isMusicPlaying);
  const setMusicPlaying = useCosmosStore((s) => s.setMusicPlaying);

  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMusic = useCallback(() => {
    if (isPlaying || globalAudio) return;
    
    setMusicPlaying(true);

    const audio = new Audio(SPACE_AMBIENT_TRACK);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    globalAudio = audio;

    audio.play().then(() => {
      const targetVolume = volume * 0.3;
      const steps = 20;
      let step = 0;

      fadeIntervalRef.current = setInterval(() => {
        step++;
        if (globalAudio) {
          globalAudio.volume = Math.min(targetVolume, (step / steps) * targetVolume);
        }
        if (step >= steps && fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }, 100);
    }).catch(() => {
      setMusicPlaying(false);
      globalAudio = null;
    });
  }, [isPlaying, volume, setMusicPlaying]);

  const stopMusic = useCallback(() => {
    if (!isPlaying || !globalAudio) return;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const audio = globalAudio;
    const startVolume = audio.volume;
    let step = 0;

    fadeIntervalRef.current = setInterval(() => {
      step++;
      if (audio) {
        audio.volume = Math.max(0, startVolume * (1 - step / 10));
      }
      if (step >= 10) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        audio.pause();
        audio.src = '';
        globalAudio = null;
        setMusicPlaying(false);
      }
    }, 100);
  }, [isPlaying, setMusicPlaying]);

  // Handle volume changes (sync audio volume with store volume)
  useEffect(() => {
    if (globalAudio && isPlaying) {
      globalAudio.volume = volume * 0.3;
    }
  }, [volume, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  return { startMusic, stopMusic, isPlaying };
};
