import { VinylRecord, RPMSpeed } from "./types";
import { VinylDisc } from "./VinylDisc";
import { Tonearm } from "./Tonearm";

interface TurntableProps {
  record: VinylRecord | null;
  isPlaying: boolean;
  isPoweredOn: boolean;
  speed: RPMSpeed;
  tonearmPosition: "rest" | "playing";
  isSwapping: boolean;
  onTonearmPositionChange?: (position: "rest" | "playing") => void;
  onScrub?: (deltaSeconds: number) => void;
}

export const Turntable = ({
  record,
  isPlaying,
  isPoweredOn,
  speed,
  tonearmPosition,
  isSwapping,
  onTonearmPositionChange,
  onScrub,
}: TurntableProps) => {
  // Calculate rotation duration based on RPM
  const getRotationDuration = () => {
    switch (speed) {
      case 33:
        return "1.82s"; // 60/33 ≈ 1.82 seconds per rotation
      case 45:
        return "1.33s"; // 60/45 ≈ 1.33 seconds per rotation
      case 78:
        return "0.77s"; // 60/78 ≈ 0.77 seconds per rotation
      default:
        return "1.82s";
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Turntable Base/Plinth - use aspect-square to maintain 1:1 ratio */}
      <div className="relative w-full h-full aspect-square bg-gradient-to-br from-secondary/80 to-secondary rounded-2xl p-6 shadow-xl">
        {/* Wood grain texture overlay */}
        <div className="absolute inset-0 rounded-2xl opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')]" />

        {/* Platter - use aspect-square wrapper to ensure circle */}
        <div className="relative w-full h-full">
          <div className="absolute inset-0 aspect-square rounded-full bg-gradient-to-b from-muted/50 to-muted border border-border/50 flex items-center justify-center shadow-inner">
            {/* Platter mat */}
            <div className="absolute inset-4 rounded-full bg-secondary/50 border border-border/30" />
            
            {/* Spindle */}
            <div className="absolute w-3 h-3 rounded-full bg-foreground/20 z-20" />

            {/* Vinyl Record */}
            <VinylDisc
              record={record}
              isSpinning={isPlaying && isPoweredOn}
              rotationDuration={getRotationDuration()}
              isSwapping={isSwapping}
              onScrub={onScrub}
            />

            {/* Power indicator light */}
            <div
              className={`absolute bottom-4 left-4 w-2 h-2 rounded-full transition-colors duration-300 ${
                isPoweredOn ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-muted-foreground/30"
              }`}
            />
          </div>
        </div>

        {/* Tonearm */}
        <Tonearm position={tonearmPosition} isPoweredOn={isPoweredOn} onPositionChange={onTonearmPositionChange} />
      </div>
    </div>
  );
};
