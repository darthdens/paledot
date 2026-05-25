import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCosmosStore } from '../store/useCosmosStore';
import { useAmbientMusic } from '../hooks/useAmbientMusic';
import { useLanguage } from '@/i18n/LanguageContext';

export const AmbientMusicController = () => {
  const { language } = useLanguage();

  const store = useCosmosStore();
  const volume = store.volume;
  const setVolume = store.setVolume;

  const { startMusic, stopMusic, isPlaying } = useAmbientMusic();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const sliderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [isPlaying, startMusic, stopMusic]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0]);
    },
    [setVolume]
  );

  // Toggle slider visibility on click/tap (for mobile support)
  const handleButtonClick = useCallback(() => {
    if (!isPlaying) {
      // If not playing, start music and show slider
      startMusic();
      setShowVolumeSlider(true);
    } else {
      // If playing, toggle slider visibility (tap to show/hide volume)
      setShowVolumeSlider(prev => !prev);
    }
  }, [isPlaying, startMusic]);

  // Mute/unmute function (separate from showing slider)
  const handleMuteToggle = useCallback(() => {
    if (isPlaying) {
      stopMusic();
      setShowVolumeSlider(false);
    }
  }, [isPlaying, stopMusic]);

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
    }, 2000); // Longer delay for touch users
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

  // Determine if effectively muted (volume at 0 or not playing)
  const isMuted = !isPlaying || volume === 0;

  const tooltipLabel = isMuted
    ? language === 'fr'
      ? 'Activer le son'
      : 'Enable sound'
    : language === 'fr'
      ? 'Désactiver le son'
      : 'Disable sound';

  // Get appropriate volume icon based on volume level
  const VolumeIcon = isMuted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Volume slider with mute button (shows when playing and toggled) */}
      <div
        className={`flex items-center gap-1 transition-all duration-300 ease-out overflow-hidden ${
          showVolumeSlider ? 'w-28 opacity-100 mr-1' : 'w-0 opacity-0'
        }`}
      >
        {/* Mute button inside slider area */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMuteToggle}
          className="h-6 w-6 flex-shrink-0 backdrop-blur-sm text-foreground bg-foreground/10 hover:bg-foreground/20"
          aria-label={language === 'fr' ? 'Couper le son' : 'Mute'}
        >
          <VolumeX className="h-3 w-3" />
        </Button>
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.05}
          variant="light"
          className="flex-1 [&_[data-radix-slider-range]]:bg-foreground/25"
          aria-label={language === 'fr' ? 'Volume' : 'Volume'}
        />
      </div>

      {/* Sound toggle button with tooltip - tap to show volume slider */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleButtonClick}
            className={`h-8 w-8 sm:h-9 sm:w-9 backdrop-blur-sm text-foreground ${
              !isMuted ? 'bg-foreground/25' : 'bg-foreground/10 hover:bg-foreground/20'
            }`}
          >
            <VolumeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="dark" side="bottom">
          {tooltipLabel}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
