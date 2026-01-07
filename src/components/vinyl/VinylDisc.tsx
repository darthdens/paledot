import { VinylRecord } from "./types";
import { useMemo, useEffect, useRef } from "react";

interface VinylDiscProps {
  record: VinylRecord | null;
  isSpinning: boolean;
  rotationDuration: string;
  isSwapping: boolean;
}

// Get vinyl color gradients based on color type
const getVinylGradient = (color: VinylRecord["color"]): string => {
  switch (color) {
    case "classic-black":
      return "linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 15%) 50%, hsl(0 0% 8%) 100%)";
    case "transparent-purple":
      return "linear-gradient(135deg, hsla(270 60% 40% / 0.8) 0%, hsla(280 70% 50% / 0.6) 50%, hsla(260 50% 35% / 0.8) 100%)";
    case "ocean-blue-marble":
      return "linear-gradient(135deg, hsl(200 70% 35%) 0%, hsl(190 80% 45%) 25%, hsl(210 60% 40%) 50%, hsl(195 75% 38%) 75%, hsl(205 65% 42%) 100%)";
    case "gold-orange-swirl":
      return "linear-gradient(135deg, hsl(40 90% 50%) 0%, hsl(25 95% 55%) 33%, hsl(45 85% 48%) 66%, hsl(30 90% 52%) 100%)";
    case "hot-pink":
      return "linear-gradient(135deg, hsl(330 85% 55%) 0%, hsl(340 90% 60%) 50%, hsl(320 80% 50%) 100%)";
    case "forest-green":
      return "linear-gradient(135deg, hsla(140 50% 30% / 0.85) 0%, hsla(150 60% 35% / 0.75) 50%, hsla(130 45% 28% / 0.85) 100%)";
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
      <div className="absolute inset-[30%] rounded-full bg-card border border-border/50 flex items-center justify-center p-2 shadow-inner">
        <div className="text-center">
          <p className="text-[0.5rem] sm:text-xs font-medium text-foreground truncate max-w-full">
            {record.album}
          </p>
          <p className="text-[0.4rem] sm:text-[0.6rem] text-muted-foreground truncate max-w-full">
            {record.artist}
          </p>
        </div>
      </div>

      {/* Center hole */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary" />
      </div>
    </>
  );
};
