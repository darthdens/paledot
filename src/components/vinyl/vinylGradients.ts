import type { VinylColor } from "./types";

// Vinyl gradients matched to album artwork color palettes
export const getVinylGradient = (color: VinylColor): string => {
  switch (color) {
    case "classic-black":
      // Dark Matter Canon - deep purple/black cosmic void
      return "linear-gradient(135deg, hsl(280 40% 8%) 0%, hsl(270 50% 15%) 50%, hsl(285 35% 6%) 100%)";
    case "noir-smoke":
      // Synthwave Soundscape - dark blue smoke/mist
      return "linear-gradient(135deg, hsl(200 50% 12%) 0%, hsl(195 45% 20%) 50%, hsl(205 40% 10%) 100%)";
    case "chrome-silver":
      // Synthwave Retro 80s - metallic chrome with pink accents
      return "linear-gradient(135deg, hsl(220 15% 65%) 0%, hsl(330 20% 75%) 40%, hsl(220 15% 60%) 70%, hsl(210 12% 55%) 100%)";
    case "midnight-purple":
      // 80s Retro Synthwave - hot pink/magenta grid sunset
      return "linear-gradient(135deg, hsl(300 60% 30%) 0%, hsl(320 70% 45%) 50%, hsl(280 55% 25%) 100%)";
    case "deep-magenta":
      // Stranger Things - deep red/magenta corridor
      return "linear-gradient(135deg, hsl(345 55% 25%) 0%, hsl(350 60% 35%) 50%, hsl(340 50% 20%) 100%)";
    case "neon-pink":
      // Cyberpunk Guitar - vivid neon pink
      return "linear-gradient(135deg, hsl(330 65% 40%) 0%, hsl(340 75% 50%) 50%, hsl(320 60% 35%) 100%)";
    case "electric-cyan":
      // Catch The Synth - electric blue/cyan synth waves
      return "linear-gradient(135deg, hsl(210 70% 30%) 0%, hsl(195 80% 45%) 50%, hsl(220 65% 25%) 100%)";
    case "sunset-orange":
      // Digital Sunrise - warm orange/red sunset
      return "linear-gradient(135deg, hsl(15 70% 40%) 0%, hsl(25 75% 50%) 50%, hsl(5 65% 35%) 100%)";
    case "golden-bronze":
      // Synth Wave Life - golden Miami sunset with car
      return "linear-gradient(135deg, hsl(35 70% 40%) 0%, hsl(40 80% 55%) 50%, hsl(25 65% 35%) 100%)";
    case "rose-gold":
      // Retro Synth Pop - pink cassette tape glow
      return "linear-gradient(135deg, hsl(345 50% 45%) 0%, hsl(355 55% 55%) 50%, hsl(340 45% 40%) 100%)";
    default:
      return "linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(0 0% 18%) 50%, hsl(0 0% 10%) 100%)";
  }
};
