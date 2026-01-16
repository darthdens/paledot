import { useEffect, useRef, useCallback } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';
import type { ScaleLevel } from '../types';

// Space ambient music tracks mapped to scale levels
// Using the synthwave tracks as ambient space music
const SCALE_TRACKS: Record<ScaleLevel, string> = {
  earth: '/audio/synthwave-soundscape.mp3', // Peaceful, intimate
  solarSystem: '/audio/digital-sunrise.mp3', // Vast, majestic
  stellar: '/audio/dark-matter-canon.mp3', // Ethereal, mysterious
  milkyWay: '/audio/synth-wave-life.mp3', // Epic, cosmic wonder
  localGroup: '/audio/stranger-things.mp3', // Vast expanse, contemplative
  virgoSupercluster: '/audio/cyberpunk-guitar.mp3', // Dense structures
  laniakea: '/audio/catch-the-synth.mp3', // Dramatic, flowing
  universe: '/audio/80s-retro-synthwave.mp3', // Profound, infinite
};

// Transition duration in milliseconds
const CROSSFADE_DURATION = 3000;

export const useAmbientMusic = () => {
  const isMuted = useCosmosStore((s) => s.isMuted);
  const volume = useCosmosStore((s) => s.volume);
  const currentScale = useCosmosStore((s) => s.currentScale);

  // Audio elements for crossfading
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const currentTrackRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preload audio for a scale level
  const preloadAudio = useCallback((scale: ScaleLevel): HTMLAudioElement => {
    const audio = new Audio(SCALE_TRACKS[scale]);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    return audio;
  }, []);

  // Crossfade between tracks
  const crossfadeTo = useCallback((newScale: ScaleLevel) => {
    const newTrack = SCALE_TRACKS[newScale];
    
    // If same track, just continue
    if (currentTrackRef.current === newTrack) return;
    
    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const currentAudio = currentAudioRef.current;
    const newAudio = preloadAudio(newScale);
    nextAudioRef.current = newAudio;

    const targetVolume = isMuted ? 0 : volume * 0.3; // Keep ambient music subtle
    const steps = 30;
    const stepDuration = CROSSFADE_DURATION / steps;
    let step = 0;

    // Start playing new track at 0 volume
    newAudio.play().catch(() => {
      // Auto-play might be blocked, will retry on user interaction
    });

    fadeIntervalRef.current = setInterval(() => {
      step++;
      const progress = step / steps;

      // Fade out current
      if (currentAudio) {
        currentAudio.volume = Math.max(0, targetVolume * (1 - progress));
      }

      // Fade in new
      newAudio.volume = targetVolume * progress;

      if (step >= steps) {
        clearInterval(fadeIntervalRef.current!);
        fadeIntervalRef.current = null;

        // Stop and cleanup old audio
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
        }

        // Set new audio as current
        currentAudioRef.current = newAudio;
        nextAudioRef.current = null;
        currentTrackRef.current = newTrack;
      }
    }, stepDuration);
  }, [isMuted, volume, preloadAudio]);

  // Start playing ambient music
  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    const audio = preloadAudio(currentScale);
    currentAudioRef.current = audio;
    currentTrackRef.current = SCALE_TRACKS[currentScale];

    // Start at 0 and fade in
    audio.volume = 0;
    audio.play().then(() => {
      const targetVolume = volume * 0.3;
      const steps = 20;
      const stepDuration = 100;
      let step = 0;

      const fadeIn = setInterval(() => {
        step++;
        audio.volume = Math.min(targetVolume, (step / steps) * targetVolume);
        if (step >= steps) {
          clearInterval(fadeIn);
        }
      }, stepDuration);
    }).catch(() => {
      // Auto-play blocked, will start on next user interaction
    });
  }, [currentScale, volume, preloadAudio]);

  // Stop ambient music
  const stopMusic = useCallback(() => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;

    // Clear any pending fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const audio = currentAudioRef.current;
    if (audio) {
      // Fade out
      const steps = 10;
      const stepDuration = 100;
      let step = 0;
      const startVolume = audio.volume;

      const fadeOut = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVolume * (1 - step / steps));
        if (step >= steps) {
          clearInterval(fadeOut);
          audio.pause();
          audio.src = '';
          currentAudioRef.current = null;
          currentTrackRef.current = null;
        }
      }, stepDuration);
    }

    // Also stop next audio if crossfading
    const nextAudio = nextAudioRef.current;
    if (nextAudio) {
      nextAudio.pause();
      nextAudio.src = '';
      nextAudioRef.current = null;
    }
  }, []);

  // Handle mute/unmute
  useEffect(() => {
    if (isMuted) {
      if (currentAudioRef.current) {
        currentAudioRef.current.volume = 0;
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.volume = 0;
      }
    } else if (isPlayingRef.current) {
      const targetVolume = volume * 0.3;
      if (currentAudioRef.current) {
        currentAudioRef.current.volume = targetVolume;
      }
    }
  }, [isMuted, volume]);

  // Handle volume changes
  useEffect(() => {
    if (!isMuted && isPlayingRef.current) {
      const targetVolume = volume * 0.3;
      if (currentAudioRef.current) {
        currentAudioRef.current.volume = targetVolume;
      }
    }
  }, [volume, isMuted]);

  // Handle scale changes - crossfade to new track
  useEffect(() => {
    if (!isPlayingRef.current || isMuted) return;
    crossfadeTo(currentScale);
  }, [currentScale, crossfadeTo, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
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

  return {
    startMusic,
    stopMusic,
    isPlaying: isPlayingRef.current,
  };
};
