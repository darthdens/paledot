import type { Tour, TourText } from '../types';
import { tourStops } from './tourStops';

export const BEGIN_AT_EARTH = 'begin-at-earth';

const registry = new Map<string, Tour>([
  [BEGIN_AT_EARTH, {
    id: BEGIN_AT_EARTH,
    title: { en: 'Begin at Earth', fr: 'Depuis la Terre', es: 'Desde la Tierra', pt: 'A partir da Terra', it: 'Dalla Terra', de: 'Von der Erde aus' },
    stops: tourStops,
    onEnd: 'end-frame',
  }],
]);

/** Brands add their own tours (e.g. Pale Dot's Left Behind tours). Begin at Earth cannot be replaced. */
export function registerTours(tours: Tour[]) {
  for (const t of tours) if (t.id !== BEGIN_AT_EARTH) registry.set(t.id, t);
}
export function hasTour(id: string) { return registry.has(id); }
export function getTour(id: string | null | undefined): Tour {
  return (id && registry.get(id)) || registry.get(BEGIN_AT_EARTH)!;
}
/** Pick a content language, falling back to the dictionary-based localiser for en/fr-only text. */
export function pickText(text: TourText, language: string, tr: (r: { en: string; fr: string }) => string) {
  return (text as Record<string, string | undefined>)[language] ?? tr(text);
}
