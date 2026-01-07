import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Power } from "lucide-react";
import { RPMSpeed } from "./types";

interface VinylControlsProps {
  isPlaying: boolean;
  isPoweredOn: boolean;
  speed: RPMSpeed;
  volume: number;
  onPlayPause: () => void;
  onPowerToggle: () => void;
  onSpeedChange: (speed: RPMSpeed) => void;
  onVolumeChange: (volume: number) => void;
  hasRecord: boolean;
  vertical?: boolean;
}

export const VinylControls = ({
  isPlaying,
  isPoweredOn,
  speed,
  volume,
  onPlayPause,
  onPowerToggle,
  onSpeedChange,
  onVolumeChange,
  hasRecord,
  vertical = false,
}: VinylControlsProps) => {
  const { t } = useLanguage();
  const speeds: RPMSpeed[] = [33, 45, 78];

  if (vertical) {
    return (
      <div className="relative z-20 h-full p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col">
        {/* Power & Play Buttons - grouped at top */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{t.vinylPlayer.power}</span>
            <Button
              variant={isPoweredOn ? "secondary" : "outline"}
              size="icon"
              onClick={onPowerToggle}
              className="relative"
              aria-label={t.vinylPlayer.power}
            >
              <Power className="h-4 w-4" />
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-colors ${
                  isPoweredOn ? "bg-green-500" : "bg-muted-foreground/30"
                }`}
              />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {isPlaying ? t.vinylPlayer.pause : t.vinylPlayer.play}
            </span>
            <Button
              variant="secondary"
              size="icon"
              onClick={onPlayPause}
              disabled={!isPoweredOn || !hasRecord}
              aria-label={isPlaying ? t.vinylPlayer.pause : t.vinylPlayer.play}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Speed Selector - middle */}
        <div className="flex flex-col items-center gap-2 mt-6">
          <span className="text-xs text-muted-foreground">{t.vinylPlayer.speed}</span>
          <div className="flex flex-col gap-1">
            {speeds.map((s) => (
              <Button
                key={s}
                variant={speed === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSpeedChange(s)}
                disabled={!isPoweredOn}
                className="text-xs px-3 h-7"
              >
                {s} RPM
              </Button>
            ))}
          </div>
        </div>

        {/* Volume - takes remaining space */}
        <div className="flex-1 flex flex-col items-center gap-2 mt-6 min-h-0">
          <span className="text-xs text-muted-foreground">{t.vinylPlayer.volume}</span>
          <div className="flex-1 flex items-center justify-center py-2">
            <Slider
              value={[volume]}
              onValueChange={([v]) => onVolumeChange(v)}
              max={100}
              step={1}
              disabled={!isPoweredOn}
              orientation="vertical"
              inverted
              className="h-full rotate-180"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Power Button */}
        <Button
          variant={isPoweredOn ? "secondary" : "outline"}
          size="icon"
          onClick={onPowerToggle}
          className="relative"
          aria-label={t.vinylPlayer.power}
        >
          <Power className="h-4 w-4" />
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-colors ${
              isPoweredOn ? "bg-green-500" : "bg-muted-foreground/30"
            }`}
          />
        </Button>

        {/* Play/Pause Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={onPlayPause}
          disabled={!isPoweredOn || !hasRecord}
          aria-label={isPlaying ? t.vinylPlayer.pause : t.vinylPlayer.play}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t.vinylPlayer.speed}</span>
          <div className="flex gap-1">
            {speeds.map((s) => (
              <Button
                key={s}
                variant={speed === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSpeedChange(s)}
                disabled={!isPoweredOn}
                className="text-xs px-2 h-7"
              >
                {s}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">RPM</span>
        </div>
      </div>

      {/* Volume - Full Width */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs text-muted-foreground flex-shrink-0">{t.vinylPlayer.volume}</span>
        <Slider
          value={[volume]}
          onValueChange={([v]) => onVolumeChange(v)}
          max={100}
          step={1}
          disabled={!isPoweredOn}
          className="flex-1"
        />
      </div>
    </div>
  );
};