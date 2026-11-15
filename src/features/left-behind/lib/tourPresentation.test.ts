// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { leftBehindTours } from '../data/tours';
import { registerTours } from '@/components/cosmos/data/tours';
import { machineTrailVisible } from './tourPresentation';
registerTours(leftBehindTours);
describe('temporary guided-tour trails', () => {
  it('shows Voyager 1 during its tour even when exploration trails are off', () => {
    expect(machineTrailVisible('voyager-1', { isTouring: true, activeTourId: 'voyager-1', tourIndex: 5, showTrails: false })).toBe(true);
  });
  it('does not force another machine trail on during a Voyager 1 tour', () => {
    expect(machineTrailVisible('voyager-2', { isTouring: true, activeTourId: 'voyager-1', tourIndex: 5, showTrails: true })).toBe(false);
  });
  it('returns to exploration trails after the tour', () => {
    expect(machineTrailVisible('voyager-1', { isTouring: false, activeTourId: 'voyager-1', tourIndex: 0, showTrails: false })).toBe(false);
  });
});