import { VinylRecord } from "./types";
import { useMemo, useEffect, useRef } from "react";

interface VinylDiscProps {
  record: VinylRecord | null;
  isSpinning: boolean;
  rotationDuration: string;
  isSwapping: boolean;
}

// Get vinyl color gradients based on color type - Drive/Retrowave inspired
const getVinylGradient = (color: VinylRecord["color"]): string => {
  switch (color) {
    case "classic-black":
      return "linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 15%) 50%, hsl(0 0% 8%) 100%)";
    case "neon-pink":
      return "linear-gradient(135deg, hsl(330 90% 45%) 0%, hsl(340 95% 55%) 50%, hsl(320 85% 40%) 100%)";
    case "chrome-silver":
      return "linear-gradient(135deg, hsl(220 10% 75%) 0%, hsl(220 15% 85%) 30%, hsl(220 10% 70%) 50%, hsl(220 15% 80%) 70%, hsl(220 10% 65%) 100%)";
    case "midnight-purple":
      return "linear-gradient(135deg, hsl(270 50% 25%) 0%, hsl(280 60% 35%) 50%, hsl(260 45% 20%) 100%)";
    case "sunset-orange":
      return "linear-gradient(135deg, hsl(25 90% 50%) 0%, hsl(15 95% 55%) 50%, hsl(35 85% 45%) 100%)";
    case "electric-cyan":
      return "linear-gradient(135deg, hsl(185 80% 40%) 0%, hsl(190 90% 50%) 50%, hsl(180 75% 35%) 100%)";
    case "deep-magenta":
      return "linear-gradient(135deg, hsl(300 60% 35%) 0%, hsl(310 70% 45%) 50%, hsl(290 55% 30%) 100%)";
    case "golden-bronze":
      return "linear-gradient(135deg, hsl(35 70% 40%) 0%, hsl(40 80% 50%) 50%, hsl(30 65% 35%) 100%)";
    case "noir-smoke":
      return "linear-gradient(135deg, hsl(240 10% 15%) 0%, hsl(240 15% 22%) 50%, hsl(240 10% 12%) 100%)";
    case "rose-gold":
      return "linear-gradient(135deg, hsl(350 40% 60%) 0%, hsl(20 50% 70%) 50%, hsl(350 35% 55%) 100%)";
    default:
      return "linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 15%) 50%, hsl(0 0% 8%) 100%)";
  }
};

export const VinylDisc = ({
  record,
  isSpinning,
  rotationDuration,
  isSwapping,
}: VinylDiscProps) => {
  const discRef = useRef<HTMLDivElement>(null);
  
  const vinylGradient = useMemo(
    () => (record ? getVinylGradient(record.color) : getVinylGradient("classic-black")),
    [record]
  );

  // Handle spinning animation
  useEffect(() => {
    const disc = discRef.current;
    if (!disc) return;

    if (isSpinning) {
      disc.style.animation = `vinyl-spin ${rotationDuration} linear infinite`;
    } else {
      // Get current rotation and hold it
      const computedStyle = window.getComputedStyle(disc);
      const transform = computedStyle.transform;
      disc.style.animation = "none";
      disc.style.transform = transform;
    }
  }, [isSpinning, rotationDuration]);

  if (!record) {
    return null;
  }

  return (
    <>
      {/* Inject keyframes for vinyl spin */}
      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        ref={discRef}
        className={`absolute inset-8 rounded-full transition-opacity duration-500 ${
          isSwapping ? "opacity-0 scale-90" : "opacity-100"
        }`}
      >
      {/* Vinyl base */}
      <div
        className="absolute inset-0 rounded-full shadow-lg"
        style={{ background: vinylGradient }}
      >
        {/* Grooves effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-foreground/5"
              style={{
                inset: `${(i + 1) * 3}%`,
              }}
            />
          ))}
        </div>

        {/* Light reflection/shimmer */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background:
              "linear-gradient(135deg, transparent 0%, hsl(var(--foreground) / 0.1) 40%, transparent 60%, hsl(var(--foreground) / 0.05) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* Center label */}
      <div className="absolute inset-[28%] rounded-full bg-card border border-border/50 flex items-center justify-center shadow-inner">
        <div className="text-center px-2 flex flex-col items-center justify-center gap-0.5">
          <p className="text-[0.4rem] sm:text-[0.55rem] font-medium text-foreground truncate max-w-full leading-tight">
            {record.trackName || record.album}
          </p>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary flex-shrink-0" />
          <p className="text-[0.35rem] sm:text-[0.5rem] text-muted-foreground truncate max-w-full">
            {record.artist}
          </p>
        </div>
      </div>
      </div>
    </>
  );
};
