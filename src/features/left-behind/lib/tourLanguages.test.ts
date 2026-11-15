// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { leftBehindTours } from '../data/tours';
import { tourStops } from '@/components/cosmos/data/tourStops';
import { LOCALES, contentLangOf, localize } from '@/i18n/locales';
import { tourPhotoIds } from './tourPresentation';
describe('complete tour language and photo availability', () => {
  for (const locale of LOCALES) it(`all tours have ${locale.code} title and narration translations`, () => {
    const lang = contentLangOf(locale.code);
    const dict: Record<string, string> = ['es', 'pt', 'it', 'de'].includes(lang) ? JSON.parse(readFileSync(`src/i18n/dict/${lang}.json`, 'utf8')) : {};
    for (const stop of [...tourStops, ...leftBehindTours.flatMap(t => t.stops)]) {
      for (const text of [stop.title, stop.narration]) {
        const explicit = (text as Record<string, string>)[lang];
        expect(explicit ?? dict[text.en], `${stop.id}/${lang}`).toBeTruthy();
        if (locale.code === 'en-US') expect(localize(text.en, text.fr, 'en-US', null)).toBeTruthy();
      }
    }
  });
  it('all machine slides resolve to sourced WebP photos', () => {
    const photos = JSON.parse(readFileSync('public/left-behind/photos/manifest.json', 'utf8')) as {id: string; imageUrl: string; sourceUrl: string; credit: string}[];
    for (const tour of leftBehindTours) for (const stop of tour.stops) {
      const ids = tourPhotoIds(tour.id, stop);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        const photo = photos.find(p => p.id === id);
        expect(photo?.imageUrl).toMatch(/\.webp$/);
        expect(photo?.sourceUrl).toMatch(/^https:\/\//);
        expect(photo?.credit).toBeTruthy();
      }
    }
  });
});