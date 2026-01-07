import { VinylRecord } from "./types";
import { getVinylGradient } from "./vinylGradients";
import { useMemo, useEffect, useRef, useCallback } from "react";

interface VinylDiscProps {
  record: VinylRecord | null;
  isSpinning: boolean;
  rotationDuration: string;
  isSwapping: boolean;
  onScrub?: (deltaSeconds: number) => void;
}

export const VinylDisc = ({
  record,
  isSpinning,
  rotationDuration,
  isSwapping,
  onScrub,
}: VinylDiscProps) => {
  const discRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef<number | null>(null);
  const manualRotationRef = useRef(0);
  
  const vinylGradient = useMemo(
    () => (record ? getVinylGradient(record.color) : getVinylGradient("classic-black")),
    [record]
  );

  // Calculate angle from center of disc to pointer
  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    const disc = discRef.current;
    if (!disc) return 0;
    
    const rect = disc.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  // Handle drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!record) return;
    
    isDraggingRef.current = true;
    lastAngleRef.current = getAngleFromCenter(e.clientX, e.clientY);
    
    // Capture pointer for smooth dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    // Pause animation while scrubbing
    const disc = discRef.current;
    if (disc) {
      const computedStyle = window.getComputedStyle(disc);
      const transform = computedStyle.transform;
      disc.style.animation = "none";
      disc.style.transform = transform;
    }
  }, [record, getAngleFromCenter]);

  // Handle drag move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || lastAngleRef.current === null) return;
    
    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    let deltaAngle = currentAngle - lastAngleRef.current;
    
    // Handle wrap-around at ±180°
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    lastAngleRef.current = currentAngle;
    
    // Update visual rotation
    manualRotationRef.current += deltaAngle;
    const disc = discRef.current;
    if (disc) {
      disc.style.transform = `rotate(${manualRotationRef.current}deg)`;
    }
    
    // Convert rotation to seek time: 360° = ~5 seconds of audio
    const secondsPerDegree = 5 / 360;
    const seekDelta = deltaAngle * secondsPerDegree;
    
    if (onScrub && Math.abs(seekDelta) > 0.01) {
      onScrub(seekDelta);
    }
  }, [getAngleFromCenter, onScrub]);

  // Handle drag end
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    lastAngleRef.current = null;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Resume spinning if was playing
    const disc = discRef.current;
    if (disc && isSpinning) {
      disc.style.animation = `vinyl-spin ${rotationDuration} linear infinite`;
    }
  }, [isSpinning, rotationDuration]);

  // Handle spinning animation
  useEffect(() => {
    const disc = discRef.current;
    if (!disc || isDraggingRef.current) return;

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
        className={`absolute inset-8 rounded-full transition-opacity duration-500 cursor-grab active:cursor-grabbing touch-none ${
          isSwapping ? "opacity-0 scale-90" : "opacity-100"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
      {/* Vinyl base */}
      <div
        className="absolute inset-0 rounded-full shadow-lg pointer-events-none"
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
      <div className="absolute inset-[28%] rounded-full bg-card border border-border/50 flex items-center justify-center shadow-inner pointer-events-none">
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
