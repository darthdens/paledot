import { useRef, useState, useEffect, useCallback } from "react";

interface TonearmProps {
  position: "rest" | "playing";
  isPoweredOn: boolean;
  onPositionChange?: (position: "rest" | "playing") => void;
}

export const Tonearm = ({ position, isPoweredOn, onPositionChange }: TonearmProps) => {
  const armRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState<number | null>(null);
  const startAngleRef = useRef(0);
  const startRotationRef = useRef(0);

  // Target rotations: rest = 5deg, playing = -25deg
  const REST_ROTATION = 5;
  const PLAYING_ROTATION = -25;
  const THRESHOLD = -10; // If rotation < -10, consider it "playing"

  const currentRotation = isDragging && dragRotation !== null 
    ? dragRotation 
    : (position === "playing" ? PLAYING_ROTATION : REST_ROTATION);

  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    if (!armRef.current) return 0;
    const rect = armRef.current.getBoundingClientRect();
    // Pivot is at top-right
    const pivotX = rect.right;
    const pivotY = rect.top;
    const angle = Math.atan2(clientY - pivotY, clientX - pivotX) * (180 / Math.PI);
    return angle;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPoweredOn) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startAngleRef.current = getAngleFromCenter(e.clientX, e.clientY);
    startRotationRef.current = position === "playing" ? PLAYING_ROTATION : REST_ROTATION;
    setDragRotation(startRotationRef.current);
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isPoweredOn, position, getAngleFromCenter]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    const angleDelta = currentAngle - startAngleRef.current;
    let newRotation = startRotationRef.current + angleDelta;
    
    // Clamp rotation between playing and rest positions
    newRotation = Math.max(PLAYING_ROTATION - 5, Math.min(REST_ROTATION + 5, newRotation));
    setDragRotation(newRotation);
  }, [isDragging, getAngleFromCenter]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    // Determine final position based on drag rotation
    if (dragRotation !== null && onPositionChange) {
      const newPosition = dragRotation < THRESHOLD ? "playing" : "rest";
      onPositionChange(newPosition);
    }
    setDragRotation(null);
  }, [isDragging, dragRotation, onPositionChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only handle click if not dragging (drag didn't move much)
    if (!isPoweredOn || !onPositionChange) return;
    
    // Toggle position
    const newPosition = position === "playing" ? "rest" : "playing";
    onPositionChange(newPosition);
  }, [isPoweredOn, position, onPositionChange]);

  return (
    <div
      ref={armRef}
      className={`absolute top-4 right-4 origin-top-right select-none ${
        isDragging ? "" : "transition-transform duration-700 ease-in-out"
      } ${isPoweredOn ? "cursor-grab" : "cursor-not-allowed opacity-50"} ${
        isDragging ? "cursor-grabbing" : ""
      }`}
      style={{ transform: `rotate(${currentRotation}deg)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={!isDragging ? handleClick : undefined}
    >
      {/* Tonearm base/pivot */}
      <div className="relative">
        {/* Pivot point */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-muted to-muted-foreground/20 border border-border/50 shadow-md flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-foreground/30" />
        </div>

        {/* Arm */}
        <div
          className="absolute top-3 right-3 w-2 h-32 bg-gradient-to-b from-muted-foreground/60 to-muted-foreground/40 rounded-full origin-top shadow-md"
          style={{ transform: "rotate(-15deg)" }}
        >
          {/* Counterweight */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-b from-foreground/30 to-foreground/20" />

          {/* Headshell */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            {/* Headshell body */}
            <div className="w-6 h-3 bg-gradient-to-b from-muted-foreground/50 to-muted-foreground/30 rounded-sm" />
            {/* Cartridge */}
            <div className="w-4 h-2 mx-auto bg-foreground/40 rounded-sm mt-0.5" />
            {/* Stylus */}
            <div
              className={`w-0.5 h-1 mx-auto bg-foreground/60 transition-opacity duration-300 ${
                isPoweredOn && position === "playing" ? "opacity-100" : "opacity-50"
              }`}
            />
          </div>
        </div>

        {/* Arm lift/cue lever */}
        <div className="absolute top-10 -left-2 w-3 h-1.5 bg-muted-foreground/40 rounded-full" />
      </div>
    </div>
  );
};
