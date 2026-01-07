export type RPMSpeed = 33 | 45 | 78;

export type VinylColor =
  | "classic-black"
  | "transparent-purple"
  | "ocean-blue-marble"
  | "gold-orange-swirl"
  | "hot-pink"
  | "forest-green";

export interface VinylRecord {
  id: string;
  artist: string;
  album: string;
  year: number;
  color: VinylColor;
  labelImage?: string;
}
