import { useEffect, useCallback } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';

// Single space ambient track for all scales
const SPACE_AMBIENT_TRACK = '/audio/space-ambient.mp3';

// Global audio instance to persist across component re-renders (and hot reload)
let globalAudio: HTMLAudioElement | null = null;
let fadeIntervalGlobal: ReturnType<typeof setInterval> | null = null;
let isFadingGlobal = false;

const clearFadeInterval = () => {
  if (fadeIntervalGlobal) {
    clearInterval(fadeIntervalGlobal);
    fadeIntervalGlobal = null;
  }
};

export const useAmbientMusic = () => {
  const store = useCosmosStore();
  const volume = store.volume;
  const isPlaying = store.isMusicPlaying;
  const setMusicPlaying = store.setMusicPlaying;

  // If hot-reload left an audio instance running, re-sync the UI state.
  useEffect(() => {
    if (!globalAudio) return;
    setMusicPlaying(!globalAudio.paused);
  }, [setMusicPlaying]);

  const startMusic = useCallback(() => {
    // If an audio instance already exists (common during hot reload), reuse it.
    if (globalAudio) {
      clearFadeInterval();
      isFadingGlobal = true;

      globalAudio.loop = true;
      globalAudio
        .play()
        .then(() => {
          setMusicPlaying(true);

          const targetVolume = volume * 0.3;
          const steps = 20;
          let step = 0;

          fadeIntervalGlobal = setInterval(() => {
            step++;
            if (globalAudio) {
              globalAudio.volume = Math.min(targetVolume, (step / steps) * targetVolume);
            }
            if (step >= steps) {
              clearFadeInterval();
              isFadingGlobal = false;
            }
          }, 100);
        })
        .catch(() => {
          isFadingGlobal = false;
          setMusicPlaying(false);
        });

      return;
    }

    clearFadeInterval();
    isFadingGlobal = true;

    const audio = new Audio(SPACE_AMBIENT_TRACK);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    globalAudio = audio;

    audio
      .play()
      .then(() => {
        setMusicPlaying(true);

        const targetVolume = volume * 0.3;
        const steps = 20;
        let step = 0;

        fadeIntervalGlobal = setInterval(() => {
          step++;
          if (globalAudio) {
            globalAudio.volume = Math.min(targetVolume, (step / steps) * targetVolume);
          }
          if (step >= steps) {
            clearFadeInterval();
            isFadingGlobal = false;
          }
        }, 100);
      })
      .catch(() => {
        isFadingGlobal = false;
        setMusicPlaying(false);
        globalAudio = null;
      });
  }, [volume, setMusicPlaying]);

  const stopMusic = useCallback(() => {
    // If state got desynced (e.g. hot reload), still stop the actual audio.
    if (!globalAudio) {
      setMusicPlaying(false);
      return;
    }

    clearFadeInterval();
    isFadingGlobal = true;
    setMusicPlaying(false);

    const audio = globalAudio;
    const startVolume = audio.volume;
    let step = 0;

    fadeIntervalGlobal = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVolume * (1 - step / 10));

      if (step >= 10) {
        clearFadeInterval();
        audio.pause();
        audio.src = '';
        globalAudio = null;
        isFadingGlobal = false;
      }
    }, 100);
  }, [setMusicPlaying]);

  // Handle volume changes (sync audio volume with store volume)
  useEffect(() => {
    if (globalAudio && isPlaying && !isFadingGlobal) {
      globalAudio.volume = volume * 0.3;
    }
  }, [volume, isPlaying]);

  return { startMusic, stopMusic, isPlaying };
};
