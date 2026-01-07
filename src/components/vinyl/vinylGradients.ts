import type { VinylColor } from "./types";

// Muted retrowave gradients (Drive-inspired, but aligned with the site's warm neutrals)
export const getVinylGradient = (color: VinylColor): string => {
  switch (color) {
    case "classic-black":
      return "linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(0 0% 18%) 50%, hsl(0 0% 10%) 100%)";
    case "noir-smoke":
      return "linear-gradient(135deg, hsl(240 10% 14%) 0%, hsl(240 12% 20%) 50%, hsl(240 10% 12%) 100%)";
    case "chrome-silver":
      return "linear-gradient(135deg, hsl(220 10% 70%) 0%, hsl(220 14% 84%) 40%, hsl(220 10% 66%) 70%, hsl(220 10% 60%) 100%)";
    case "midnight-purple":
      return "linear-gradient(135deg, hsl(270 28% 20%) 0%, hsl(280 32% 30%) 50%, hsl(260 26% 16%) 100%)";
    case "deep-magenta":
      return "linear-gradient(135deg, hsl(305 35% 26%) 0%, hsl(315 40% 34%) 50%, hsl(295 32% 22%) 100%)";
    case "neon-pink":
      // still "neon" but toned down to avoid being flashy
      return "linear-gradient(135deg, hsl(335 55% 34%) 0%, hsl(345 60% 44%) 50%, hsl(320 50% 30%) 100%)";
    case "electric-cyan":
      return "linear-gradient(135deg, hsl(190 45% 28%) 0%, hsl(190 55% 38%) 50%, hsl(180 40% 24%) 100%)";
    case "sunset-orange":
      return "linear-gradient(135deg, hsl(25 55% 38%) 0%, hsl(18 60% 46%) 50%, hsl(35 50% 34%) 100%)";
    case "golden-bronze":
      return "linear-gradient(135deg, hsl(38 45% 34%) 0%, hsl(42 50% 44%) 50%, hsl(30 40% 30%) 100%)";
    case "rose-gold":
      return "linear-gradient(135deg, hsl(350 28% 52%) 0%, hsl(18 30% 62%) 50%, hsl(350 26% 46%) 100%)";
    default:
      return "linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(0 0% 18%) 50%, hsl(0 0% 10%) 100%)";
  }
};
