// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
export const LOOK_DATE = Date.parse('1990-02-14T12:00:00Z');
export const TURN_SECONDS = 3;
export const PORTRAIT_PLANETS = ['venus', 'earth', 'jupiter', 'saturn', 'uranus', 'neptune'] as const;
export const lookMeasurements = (voyager: number[], earth: number[], diameterKm: number) => {
  const distanceKm = Math.hypot(...voyager.map((v, i) => v - (earth[i] ?? 0)));
  const sunKm = Math.hypot(...voyager);
  if (Math.abs(sunKm / 6e9 - 1) > .1) throw new Error('TODO(source): Voyager distance disagrees with NASA');
  return { distanceKm, sunKm, angularRadians: diameterKm / distanceKm };
};
export const pixelWidths = (dpr: number) => ({ screen: 1 / dpr, voyager: .12 / dpr });
export const lastLookProgress = (tourIndex: number, stage: number, totalStops: number) => ({
  label: `${tourIndex + 1}.${stage + 1}`,
  fraction: (tourIndex + (stage + 1) / 6) / totalStops,
});
export const useOneLastLook = create<{ stage: number; turn: number; points: Record<string, { x: number; y: number }>; setStage: (stage: number) => void }>(set => ({
  stage: 0, turn: 0, points: {}, setStage: stage => set({ stage, turn: stage > 1 ? 1 : 0 }),
}));