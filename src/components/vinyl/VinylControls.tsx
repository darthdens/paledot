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
}: VinylControlsProps) => {
  const { t } = useLanguage();
  const speeds: RPMSpeed[] = [33, 45, 78];

  return (
    <div className="mt-6 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
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

        {/* Volume Knob */}
        <div className="flex items-center gap-3 min-w-[120px]">
          <span className="text-xs text-muted-foreground">{t.vinylPlayer.volume}</span>
          <Slider
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            max={100}
            step={1}
            disabled={!isPoweredOn}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};
