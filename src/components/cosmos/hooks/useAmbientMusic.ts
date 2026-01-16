import { useEffect, useRef, useCallback, useState } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';
import type { ScaleLevel } from '../types';

// Space ambient music tracks mapped to scale levels
const SCALE_TRACKS: Record<ScaleLevel, string> = {
  earth: '/audio/synthwave-soundscape.mp3',
  solarSystem: '/audio/digital-sunrise.mp3',
  stellar: '/audio/dark-matter-canon.mp3',
  milkyWay: '/audio/synth-wave-life.mp3',
  localGroup: '/audio/stranger-things.mp3',
  virgoSupercluster: '/audio/cyberpunk-guitar.mp3',
  laniakea: '/audio/catch-the-synth.mp3',
  universe: '/audio/80s-retro-synthwave.mp3',
};

const CROSSFADE_DURATION = 3000;

export const useAmbientMusic = () => {
  const isMuted = useCosmosStore((s) => s.isMuted);
  const volume = useCosmosStore((s) => s.volume);
  const currentScale = useCosmosStore((s) => s.currentScale);

  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preloadAudio = useCallback((scale: ScaleLevel): HTMLAudioElement => {
    const audio = new Audio(SCALE_TRACKS[scale]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    return audio;
  }, []);

  const crossfadeTo = useCallback((newScale: ScaleLevel) => {
    const newTrack = SCALE_TRACKS[newScale];
    if (currentTrackRef.current === newTrack) return;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const currentAudio = currentAudioRef.current;
    const newAudio = preloadAudio(newScale);
    nextAudioRef.current = newAudio;

    const targetVolume = isMuted ? 0 : volume * 0.3;
    const steps = 30;
    const stepDuration = CROSSFADE_DURATION / steps;
    let step = 0;

    newAudio.play().catch(() => {});

    fadeIntervalRef.current = setInterval(() => {
      step++;
      const progress = step / steps;

      if (currentAudio) {
        currentAudio.volume = Math.max(0, targetVolume * (1 - progress));
      }
      newAudio.volume = targetVolume * progress;

      if (step >= steps) {
        clearInterval(fadeIntervalRef.current!);
        fadeIntervalRef.current = null;

        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
        }

        currentAudioRef.current = newAudio;
        nextAudioRef.current = null;
        currentTrackRef.current = newTrack;
      }
    }, stepDuration);
  }, [isMuted, volume, preloadAudio]);

  const startMusic = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);

    const audio = preloadAudio(currentScale);
    currentAudioRef.current = audio;
    currentTrackRef.current = SCALE_TRACKS[currentScale];

    audio.volume = 0;
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
  }, [isPlaying, currentScale, volume, preloadAudio]);

  const stopMusic = useCallback(() => {
    if (!isPlaying) return;
    setIsPlaying(false);

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const audio = currentAudioRef.current;
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
          currentAudioRef.current = null;
          currentTrackRef.current = null;
        }
      }, 100);
    }

    const nextAudio = nextAudioRef.current;
    if (nextAudio) {
      nextAudio.pause();
      nextAudio.src = '';
      nextAudioRef.current = null;
    }
  }, [isPlaying]);

  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume * 0.3;
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = targetVolume;
    }
    if (nextAudioRef.current && !isMuted) {
      nextAudioRef.current.volume = targetVolume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (!isPlaying || isMuted) return;
    crossfadeTo(currentScale);
  }, [currentScale, crossfadeTo, isMuted, isPlaying]);

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = '';
      }
    };
  }, []);

  return { startMusic, stopMusic, isPlaying };
};
