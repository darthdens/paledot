// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Photo, Trajectory } from './types';

const directory = 'public/left-behind/trajectories';
describe('Saved NASA data', () => {
  it('ships exactly nine trajectory files, each below 1 MB', () => {
    const files = readdirSync(directory).sort();
    expect(files).toEqual(['apollo-11.json','apollo-15.json','apollo-16.json','apollo-17.json','ingenuity.json','opportunity.json','viking-1.json','voyager-1.json','voyager-2.json']);
    for (const file of files) expect(statSync(`${directory}/${file}`).size).toBeLessThanOrEqual(1048576);
  });
  it('preserves Horizons sources for Voyagers and Ingenuity and simplified Apollo milestones', () => {
    for (const [id, target] of [['voyager-1','-31'],['voyager-2','-32'],['ingenuity','-168']]) {
      const data: Trajectory = JSON.parse(readFileSync(`${directory}/${id}.json`, 'utf8'));
      expect(data.source).toBe('horizons'); expect(data.target).toBe(target);
      expect(data.segments?.[0]?.positions.length).toBeGreaterThan(0);
    }
    for (const id of ['apollo-11','apollo-15','apollo-16','apollo-17']) {
      const data: Trajectory = JSON.parse(readFileSync(`${directory}/${id}.json`, 'utf8'));
      expect(data.source).toBe('simplified'); expect(data.segments).toBeUndefined(); expect(data.milestones?.launch).toMatch(/^\d{4}-/);
    }
  });
  it('preserves the sixteen machine photo slots and five sourced tour photographs', () => {
    const photos: Photo[] = JSON.parse(readFileSync('public/left-behind/photos/manifest.json', 'utf8'));
    expect(photos).toHaveLength(21); expect(new Set(photos.map(p => p.id)).size).toBe(21);
    for (const [id, count] of [['apollo-11',2],['lunar-rovers',2],['viking-1',2],['opportunity',2],['ingenuity',2],['voyager-2',2],['voyager-1',4]] as const) {
      expect(photos.filter(p => p.id.startsWith(`${id}-`))).toHaveLength(count);
    }
    for (const photo of photos) {
      if (photo.todo) { expect(photo.title).toBe('TODO(source)'); expect(photo.imageUrl).toBe(''); }
      else { expect(photo.sourceUrl).toMatch(/^https:\/\//); expect(photo.imageUrl).toMatch(/^\/__l5e\/assets-v1\/.*\.webp$/); expect(photo.credit).toMatch(/NASA/); }
    }
  });
});