interface TonearmProps {
  position: "rest" | "playing";
  isPoweredOn: boolean;
}

export const Tonearm = ({ position, isPoweredOn }: TonearmProps) => {
  const rotation = position === "playing" ? -25 : 5;

  return (
    <div
      className="absolute top-4 right-4 origin-top-right transition-transform duration-700 ease-in-out"
      style={{ transform: `rotate(${rotation}deg)` }}
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
