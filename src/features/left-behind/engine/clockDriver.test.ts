// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { beforeEach, expect, it } from 'vitest';
import { createClockDriver } from './clockDriver';
import { useSimClock } from '../state/useSimClock';

const start = Date.UTC(2026, 10, 15, 11, 53);
beforeEach(() => useSimClock.setState({ simDate: start, isPlaying: true, rate: 1, preTour: null, tourPlay: null }));

it('ticks through thirty seconds on the opening screen before the universe loads', () => {
  const tick = createClockDriver(start);
  tick(start + 1000);
  tick(start + 30000);
  expect(useSimClock.getState().simDate).toBe(start + 30000);
});

it('shares elapsed time between opening-screen ticks and scene frames without double speed', () => {
  const tick = createClockDriver(start);
  tick(start + 250);
  tick(start + 250);
  tick(start + 266);
  tick(start + 1000);
  expect(useSimClock.getState().simDate).toBe(start + 1000);
});

it('does not catch up paused tour time on resume', () => {
  const tick = createClockDriver(start);
  tick(start + 1000, true);
  tick(start + 31000, true);
  tick(start + 32000);
  expect(useSimClock.getState().simDate).toBe(start + 1000);
});

it('respects the selected simulation speed', () => {
  useSimClock.getState().setRate(60);
  const tick = createClockDriver(start);
  tick(start + 1000);
  expect(useSimClock.getState().simDate).toBe(start + 60000);
});