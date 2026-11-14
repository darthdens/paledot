// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { beforeEach, expect, it } from 'vitest';
import { advanceDate, CLOCK_RATES, CLOCK_START, CLOCK_END } from './clock';
import { useSimClock } from '../state/useSimClock';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
beforeEach(() => useSimClock.setState({ simDate: Date.now(), isPlaying: true, rate: 1, preTour: null }));
it('opens today, playing at one simulated second per real second', () => {
  expect(Math.abs(useSimClock.getState().simDate-Date.now())).toBeLessThan(1000);
  expect(useSimClock.getState().isPlaying).toBe(true);
  expect(useSimClock.getState().rate).toBe(1);
  expect(advanceDate(CLOCK_START,1,1)).toBe(CLOCK_START+1000);
});
it('offers real time, minute, hour, day, month and year per second', () => {
  expect(CLOCK_RATES).toEqual([1,60,3600,86400,2592000,31557600]);
  for (const rate of CLOCK_RATES) expect(advanceDate(CLOCK_START,1,rate)).toBe(CLOCK_START+rate*1000);
});
it('clamps scrubbing to 1 January 1957 through 31 December 2100', () => {
  expect(CLOCK_START).toBe(Date.UTC(1957,0,1));
  expect(CLOCK_END).toBe(Date.UTC(2100,11,31,23,59,59,999));
  useSimClock.getState().setSimDate(Date.UTC(1956,0,1)); expect(useSimClock.getState().simDate).toBe(CLOCK_START);
  useSimClock.getState().setSimDate(Date.UTC(2102,0,1)); expect(useSimClock.getState().simDate).toBe(CLOCK_END);
});
it('paused clock never advances', () => {
  useSimClock.getState().togglePlaying(); const date = useSimClock.getState().simDate;
  useSimClock.getState().advanceClock(1); expect(useSimClock.getState().simDate).toBe(date);
});
it('shortcuts step through the six rates without wrapping', () => {
  useSimClock.getState().changeSpeed(1); expect(useSimClock.getState().rate).toBe(60);
  useSimClock.getState().changeSpeed(-1); expect(useSimClock.getState().rate).toBe(1);
  useSimClock.getState().changeSpeed(-1); expect(useSimClock.getState().rate).toBe(1);
});
it('Begin at Earth pauses and restores the previous playing state and speed', () => {
  useSimClock.getState().setRate(86400);
  useCosmosStore.getState().startTour(); expect(useSimClock.getState().isPlaying).toBe(false);
  useCosmosStore.getState().stopTour(); expect(useSimClock.getState().isPlaying).toBe(true);
  expect(useSimClock.getState().rate).toBe(86400);
  useSimClock.getState().togglePlaying(); useCosmosStore.getState().startTour(); useCosmosStore.getState().stopTour();
  expect(useSimClock.getState().isPlaying).toBe(false);
});

it('one minute per second advances exactly 60 seconds', () => {
  useSimClock.getState().setSimDate(Date.UTC(2026,10,14,13,0,0));
  useSimClock.getState().setRate(60);
  useSimClock.getState().advanceClock(1);
  expect(useSimClock.getState().simDate).toBe(Date.UTC(2026,10,14,13,1,0));
});
