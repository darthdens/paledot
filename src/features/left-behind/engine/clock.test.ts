// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { afterEach, expect, it, vi } from 'vitest';
import { advanceDate, CLOCK_DAY_MS, CLOCK_START } from './clock';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
afterEach(() => { vi.useRealTimers(); useLeftBehindStore.getState().exit(); });
it('entry starts now and paused, including after re-entry', () => {
  vi.spyOn(Date,'now').mockReturnValue(Date.UTC(2026,10,14,11,48));
  useLeftBehindStore.getState().enter();
  expect(useLeftBehindStore.getState().simDate).toBe(Date.UTC(2026,10,14,11,48));
  expect(useLeftBehindStore.getState().isPlaying).toBe(false);
});
it('one real second advances exactly 1, 30 or 365 simulation days', () => {
  for (const rate of [1,30,365]) expect(advanceDate(CLOCK_START,1,rate,CLOCK_START+1000*CLOCK_DAY_MS)).toBe(CLOCK_START+rate*CLOCK_DAY_MS);
});
it('paused and exited clocks never advance', () => {
  useLeftBehindStore.getState().enter();
  useLeftBehindStore.getState().setSimDate(CLOCK_START);
  useLeftBehindStore.getState().advanceClock(1);
  expect(useLeftBehindStore.getState().simDate).toBe(CLOCK_START);
  useLeftBehindStore.getState().togglePlaying(); useLeftBehindStore.getState().exit();
  useLeftBehindStore.getState().advanceClock(1);
  expect(useLeftBehindStore.getState().simDate).toBe(CLOCK_START);
});
it('scrubbing and playback clamp to 1 July 1969 through today', () => {
  expect(advanceDate(CLOCK_START-100,0,1,CLOCK_START+100)).toBe(CLOCK_START);
  expect(advanceDate(CLOCK_START,100,365,CLOCK_START+100)).toBe(CLOCK_START+100);
});
it('speed shortcuts step through 1, 30, 365 days/s', () => {
  useLeftBehindStore.getState().setPlaybackRate(1);
  useLeftBehindStore.getState().changeSpeed(1); expect(useLeftBehindStore.getState().playbackRate).toBe(30);
  useLeftBehindStore.getState().changeSpeed(1); expect(useLeftBehindStore.getState().playbackRate).toBe(365);
  useLeftBehindStore.getState().changeSpeed(-1); expect(useLeftBehindStore.getState().playbackRate).toBe(30);
});