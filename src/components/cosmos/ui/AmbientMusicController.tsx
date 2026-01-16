import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCosmosStore } from '../store/useCosmosStore';
import { useAmbientMusic } from '../hooks/useAmbientMusic';
import { useLanguage } from '@/i18n/LanguageContext';

export const AmbientMusicController = () => {
  const { language } = useLanguage();
  const isMuted = useCosmosStore((s) => s.isMuted);
  const volume = useCosmosStore((s) => s.volume);
  const setMuted = useCosmosStore((s) => s.setMuted);
  const setVolume = useCosmosStore((s) => s.setVolume);

  const { startMusic, stopMusic } = useAmbientMusic();
  const [isActive, setIsActive] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMusic = useCallback(() => {
    if (isActive) {
      stopMusic();
      setIsActive(false);
    } else {
      startMusic();
      setIsActive(true);
      if (isMuted) {
        setMuted(false);
      }
    }
  }, [isActive, startMusic, stopMusic, isMuted, setMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setMuted(true);
    } else if (isMuted) {
      setMuted(false);
    }
  }, [setVolume, isMuted, setMuted]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setMuted(false);
      if (!isActive) {
        startMusic();
        setIsActive(true);
      }
    } else {
      setMuted(true);
    }
  }, [isMuted, setMuted, isActive, startMusic]);

  const handleMouseEnter = useCallback(() => {
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
    }
    setShowVolumeSlider(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    sliderTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="flex items-center gap-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Volume slider (shows on hover) */}
      <div 
        className={`flex items-center transition-all duration-300 overflow-hidden ${
          showVolumeSlider ? 'w-20 opacity-100 mr-1' : 'w-0 opacity-0'
        }`}
      >
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.05}
          className="w-full"
          aria-label={language === 'fr' ? 'Volume' : 'Volume'}
        />
      </div>

      {/* Mute/Unmute button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMuteToggle}
        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
        title={isMuted 
          ? (language === 'fr' ? 'Activer le son' : 'Unmute') 
          : (language === 'fr' ? 'Couper le son' : 'Mute')
        }
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Music toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMusic}
        className={`h-8 w-8 transition-colors ${
          isActive 
            ? 'text-primary bg-primary/20 hover:bg-primary/30' 
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
        title={isActive 
          ? (language === 'fr' ? 'Désactiver la musique ambiante' : 'Disable ambient music') 
          : (language === 'fr' ? 'Activer la musique ambiante' : 'Enable ambient music')
        }
      >
        <Music className="h-4 w-4" />
      </Button>
    </div>
  );
};
