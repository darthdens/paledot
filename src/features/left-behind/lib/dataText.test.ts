// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import data from './dataTranslations.json';
const hw = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8'));
const man = JSON.parse(readFileSync('public/left-behind/photos/manifest.json', 'utf8'));
describe('machine card translations', () => {
  const texts = new Set<string>();
  for (const m of hw.machines) [m.name, m.whereNow, ...(m.leftBehind ?? []), ...m.keyDates.map((k: { label: string }) => k.label), ...m.facts.map((f: { text: string }) => f.text), ...(m.sources ?? []).map((s: { title: string }) => s.title)].forEach(t => t && texts.add(t));
  for (const lang of ['fr', 'es', 'pt', 'it', 'de'] as const) it(`every card text has a ${lang} translation`, () => {
    const missing = [...texts].filter(t => !(data.strings as Record<string, Record<string, string>>)[lang]?.[t]);
    expect(missing).toEqual([]);
  });
  it('every photo caption exists in es, pt, it and de', () => {
    for (const p of man) for (const l of ['es', 'pt', 'it', 'de']) expect((data.captions as Record<string, Record<string, string>>)[p.id]?.[l]).toBeTruthy();
  });
});
