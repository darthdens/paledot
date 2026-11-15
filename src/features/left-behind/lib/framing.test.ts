// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { machineVisit, needsMachineSummary } from './framing';
import type { Machine } from '../data/types';
const machines = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8')).machines as Machine[];
describe('Left Behind framing rules', () => {
  it('visits Apollo 11 on its landing date when the clock precedes its existence', () => {
    const machine = machines.find(m => m.id === 'apollo-11');
    if (!machine) throw new Error('Missing Apollo 11');
    expect(machineVisit(machine, Date.parse('1960-01-01')).date).toBe(Date.parse('1969-07-20T20:17:00Z'));
  });
  it('preserves a date at which the selected machine exists', () => {
    const machine = machines.find(m => m.id === 'voyager-1');
    if (!machine) throw new Error('Missing Voyager 1');
    expect(machineVisit(machine, Date.parse('2026-11-15')).date).toBe(Date.parse('2026-11-15'));
  });
  it('shows the seven-machine summary only for Voyager 1, never Begin at Earth', () => {
    expect(needsMachineSummary('voyager-1')).toBe(true);
    expect(needsMachineSummary('begin-at-earth')).toBe(false);
    expect(needsMachineSummary('voyager-2')).toBe(false);
  });
});