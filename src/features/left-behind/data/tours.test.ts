// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { leftBehindTours } from './tours';
import { getTour, registerTours } from '@/components/cosmos/data/tours';
import { tourStops } from '@/components/cosmos/data/tourStops';

const hardware = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8')) as { machines: { facts: { id: string }[] }[] };
const factIds = new Set(hardware.machines.flatMap(m => m.facts.map(f => f.id)));

describe('Left Behind tours', () => {
  it('lists the seven tours in order of distance from Earth', () => {
    expect(leftBehindTours.map(t => t.id)).toEqual(['apollo-11', 'lunar-rovers', 'viking-1', 'opportunity', 'ingenuity', 'voyager-2', 'voyager-1']);
  });
  it('every narration cites existing fact ids, or is TODO(source)', () => {
    for (const t of leftBehindTours) for (const s of t.stops) {
      if (s.narration.en === 'TODO(source)') continue;
      expect(s.factIds?.length, s.id).toBeGreaterThan(0);
      for (const id of s.factIds!) expect(factIds.has(id), `${s.id}: ${id}`).toBe(true);
    }
  });
  it('narrations are at most 45 words', () => {
    for (const t of leftBehindTours) for (const s of t.stops) expect(s.narration.en.split(/\s+/).length, s.id).toBeLessThanOrEqual(45);
  });
  it('the sixth lunar-rover step uses sourced facts rather than an unfinished entry', () => {
    const step = leftBehindTours.find(t => t.id === 'lunar-rovers')?.stops[5];
    expect(step?.factIds).toEqual(['lrv-dates', 'lrv-coords']);
  });
  it('the lunar-rover final step remains a close surface view', () => {
    const step = leftBehindTours.find(t => t.id === 'lunar-rovers')?.stops.at(-1);
    expect(step?.follow).toBe('hw:apollo-17');
    expect(step?.distanceKm).toBe(0.03);
  });
  it('Viking, Opportunity and Ingenuity step four follows the same Mars machine as arrival', () => {
    for (const id of ['viking-1', 'opportunity', 'ingenuity']) {
      const tour = leftBehindTours.find(t => t.id === id);
      expect(tour?.stops[3]?.follow).toBe(`hw:${id}`);
      expect(tour?.stops[3]?.follow).toBe(tour?.stops[2]?.follow);
    }
  });
  it('both Voyagers frame their interstellar stops at 30 metres', () => {
    for (const id of ['voyager-1', 'voyager-2']) {
      const tour = leftBehindTours.find(t => t.id === id);
      expect(tour?.stops.find(s => s.id === `${id}-heliopause`)?.distanceKm).toBe(0.03);
      expect(tour?.stops.at(-1)?.distanceKm).toBe(0.03);
    }
  });
  it('Voyager tours have a stop per flyby', () => {
    expect(leftBehindTours.find(t => t.id === 'voyager-2')!.stops.map(s => s.id.replace('voyager-2-', ''))).toEqual(['launch', 'jupiter', 'saturn', 'uranus', 'neptune', 'heliopause', 'now']);
    expect(leftBehindTours.find(t => t.id === 'voyager-1')!.stops.map(s => s.id.replace('voyager-1-', ''))).toEqual(['launch', 'jupiter', 'saturn-titan', 'one-last-look', 'heliopause', 'now']);
  });
  it('only Begin at Earth ends on the end frame, with its stops unchanged', () => {
    registerTours(leftBehindTours);
    expect(getTour('begin-at-earth').onEnd).toBe('end-frame');
    expect(getTour('begin-at-earth').stops).toBe(tourStops);
    for (const t of leftBehindTours) expect(getTour(t.id).onEnd).toBe('left-behind-summary');
  });
});
