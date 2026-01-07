import { useRef, useState, useCallback } from "react";

interface TonearmProps {
  position: "rest" | "playing";
  isPoweredOn: boolean;
  onPositionChange?: (position: "rest" | "playing") => void;
}

export const Tonearm = ({ position, isPoweredOn, onPositionChange }: TonearmProps) => {
  const armRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRotation, setDragRotation] = useState<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, rotation: 0 });

  // Target rotations: rest = 0deg, playing = 38deg (reaches inner grooves)
  const REST_ROTATION = 0;
  const PLAYING_ROTATION = 38;
  const THRESHOLD = 20; // If rotation > 20, consider it "playing"

  const currentRotation = isDragging && dragRotation !== null 
    ? dragRotation 
    : (position === "playing" ? PLAYING_ROTATION : REST_ROTATION);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPoweredOn) return;
    e.preventDefault();
    e.stopPropagation();
    
    const startRotation = position === "playing" ? PLAYING_ROTATION : REST_ROTATION;
    dragStartRef.current = { x: e.clientX, y: e.clientY, rotation: startRotation };
    setDragRotation(startRotation);
    setIsDragging(true);
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isPoweredOn, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Use horizontal movement as the primary drag input (left = toward record, right = away)
    const deltaX = e.clientX - dragStartRef.current.x;
    // Moving left should increase rotation (toward PLAYING_ROTATION)
    const rotationChange = deltaX * 0.3;
    let newRotation = dragStartRef.current.rotation - rotationChange;

    // Clamp rotation between rest and playing
    newRotation = Math.max(REST_ROTATION, Math.min(PLAYING_ROTATION, newRotation));
    setDragRotation(newRotation);
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    // Determine final position based on drag rotation
    if (dragRotation !== null && onPositionChange) {
      const newPosition = dragRotation > THRESHOLD ? "playing" : "rest";
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
      className={`absolute top-2 right-2 sm:top-4 sm:right-4 select-none ${
        isPoweredOn ? "cursor-grab" : "cursor-not-allowed opacity-50"
      } ${isDragging ? "cursor-grabbing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={!isDragging ? handleClick : undefined}
    >
      {/* Fixed pivot base - does NOT rotate */}
      <div className="relative">
        {/* Pivot point (fixed) - smaller on mobile */}
        <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-muted to-muted-foreground/20 border border-border/50 shadow-md flex items-center justify-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-foreground/30" />
        </div>

        {/* Rotating arm container - pivots from center of the base */}
        <div
          className={`absolute top-2.5 right-2.5 sm:top-4 sm:right-4 origin-top ${
            isDragging ? "" : "transition-transform duration-700 ease-in-out"
          }`}
          style={{ transform: `rotate(${currentRotation}deg)` }}
        >
          {/* Arm - responsive height, reaches inner circle on all sizes */}
          <div
            className="w-1.5 h-32 sm:w-2 sm:h-36 bg-gradient-to-b from-muted-foreground/60 to-muted-foreground/40 rounded-full shadow-md"
            style={{ transform: "rotate(-25deg)", transformOrigin: "top center" }}
          >
            {/* Counterweight */}
            <div className="absolute -top-0.5 sm:-top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-b from-foreground/30 to-foreground/20" />

            {/* Headshell */}
            <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
              {/* Headshell body */}
              <div className="w-4 h-2 sm:w-6 sm:h-3 bg-gradient-to-b from-muted-foreground/50 to-muted-foreground/30 rounded-sm" />
              {/* Cartridge */}
              <div className="w-2.5 h-1 sm:w-4 sm:h-2 mx-auto bg-foreground/40 rounded-sm mt-0.5" />
              {/* Stylus */}
              <div
                className={`w-0.5 h-0.5 sm:h-1 mx-auto bg-foreground/60 transition-opacity duration-300 ${
                  isPoweredOn && position === "playing" ? "opacity-100" : "opacity-50"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Arm lift/cue lever (fixed with base) - smaller on mobile */}
        <div className="absolute top-6 sm:top-10 -left-1 sm:-left-2 w-2 h-1 sm:w-3 sm:h-1.5 bg-muted-foreground/40 rounded-full" />
      </div>
    </div>
  );
};
