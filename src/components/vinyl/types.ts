export type RPMSpeed = 33 | 45 | 78;

export type VinylColor =
  | "classic-black"
  | "neon-pink"
  | "chrome-silver"
  | "midnight-purple"
  | "sunset-orange"
  | "electric-cyan"
  | "deep-magenta"
  | "golden-bronze"
  | "noir-smoke"
  | "rose-gold"
  | "retrowave-purple";

export interface VinylRecord {
  id: string;
  artist: string;
  album: string;
  trackName: string;
  year: number;
  color: VinylColor;
  labelImage?: string;
  trackUrl?: string;
}
