// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hardware = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8'));
const facts = [...hardware.machines.flatMap((m: { facts: unknown[] }) => m.facts), ...hardware.shared.facts];
const expectedSources: Record<string, string> = {
  'mer-launch': 'https://science.nasa.gov/mission/mer-opportunity/',
  'ing-launch': 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  'v2-helio': 'https://science.nasa.gov/resource/oort-cloud-and-scale-of-the-solar-system-infographic/',
  'v1-pbd': 'https://photojournal.jpl.nasa.gov/catalog/pia00452',
  'v1-helio': 'https://science.nasa.gov/mission/voyager/questions-and-answers-with-dr-ed-stone/',
  dsn: 'https://www.nasa.gov/communicating-with-missions/dsn/',
  'light-speed': 'https://physics.nist.gov/cgi-bin/cuu/Value?c',
};

describe('Flagged hardware fact source audit', () => {
  for (const [id, source] of Object.entries(expectedSources)) {
    it(`records an opened supporting source and dated verification for ${id}`, () => {
      const fact = facts.find(f => f.id === id);
      expect(fact).toBeDefined();
      expect(fact?.verify).toBe(false);
      expect(fact?.verifiedAt).toMatch(/^2026-11-15T/);
      expect(Number.isFinite(Date.parse(fact?.verifiedAt ?? ''))).toBe(true);
      expect(fact?.verificationSources).toContain(source);
    });
  }
});