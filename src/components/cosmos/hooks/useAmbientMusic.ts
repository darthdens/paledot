import { useEffect, useRef, useCallback, useState } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';

// Single space ambient track for all scales
const SPACE_AMBIENT_TRACK = '/audio/space-ambient.mp3';

export const useAmbientMusic = () => {
  const isMuted = useCosmosStore((s) => s.isMuted);
  const volume = useCosmosStore((s) => s.volume);

  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startMusic = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);

    const audio = new Audio(SPACE_AMBIENT_TRACK);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    audio.play().then(() => {
      const targetVolume = volume * 0.3;
      const steps = 20;
      let step = 0;

      const fadeIn = setInterval(() => {
        step++;
        audio.volume = Math.min(targetVolume, (step / steps) * targetVolume);
        if (step >= steps) clearInterval(fadeIn);
      }, 100);
    }).catch(() => {});
  }, [isPlaying, volume]);

  const stopMusic = useCallback(() => {
    if (!isPlaying) return;
    setIsPlaying(false);

    const audio = audioRef.current;
    if (audio) {
      const startVolume = audio.volume;
      let step = 0;

      const fadeOut = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVolume * (1 - step / 10));
        if (step >= 10) {
          clearInterval(fadeOut);
          audio.pause();
          audio.src = '';
          audioRef.current = null;
        }
      }, 100);
    }
  }, [isPlaying]);

  // Handle volume/mute changes
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume * 0.3;
    if (audioRef.current) {
      audioRef.current.volume = targetVolume;
    }
  }, [isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return { startMusic, stopMusic, isPlaying };
};
