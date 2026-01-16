import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCosmosStore } from '../store/useCosmosStore';
import { useAmbientMusic } from '../hooks/useAmbientMusic';
import { useLanguage } from '@/i18n/LanguageContext';

export const AmbientMusicController = () => {
  const { language } = useLanguage();
  const volume = useCosmosStore((s) => s.volume);
  const setVolume = useCosmosStore((s) => s.setVolume);

  const { startMusic, stopMusic, isPlaying } = useAmbientMusic();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [isPlaying, startMusic, stopMusic]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  const handleMouseEnter = useCallback(() => {
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
    }
    if (isPlaying) {
      setShowVolumeSlider(true);
    }
  }, [isPlaying]);

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

  // Hide slider when music stops
  useEffect(() => {
    if (!isPlaying) {
      setShowVolumeSlider(false);
    }
  }, [isPlaying]);

  const tooltipLabel = isPlaying 
    ? (language === 'fr' ? 'Désactiver le son' : 'Disable sound') 
    : (language === 'fr' ? 'Activer le son' : 'Enable sound');

  return (
    <div 
      className="flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Volume slider (shows on hover when playing) - animates width */}
      <div 
        className={`flex items-center transition-all duration-300 ease-out overflow-hidden ${
          showVolumeSlider ? 'w-20 opacity-100 mr-1' : 'w-0 opacity-0'
        }`}
      >
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.05}
          variant="light"
          className="w-full [&_[data-radix-slider-range]]:bg-white/60"
          aria-label={language === 'fr' ? 'Volume' : 'Volume'}
        />
      </div>

      {/* Sound toggle button with tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className={`h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-sm text-white ${
              isPlaying ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="dark" side="bottom">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
