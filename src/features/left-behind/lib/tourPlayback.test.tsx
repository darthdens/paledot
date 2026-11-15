// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTourPlayback } from './useTourPlayback';
import { tourSlideSeconds } from './tourPlayback';
import { leftBehindTours } from '../data/tours';
afterEach(() => vi.useRealTimers());
describe('automatic tour playback', () => {
  it('advances playing slides despite unrelated renders and new callback identities', () => {
    vi.useFakeTimers(); const advance = vi.fn();
    const hook = renderHook(() => useTourPlayback('voyager-1-launch', false, 15, () => advance()));
    for (let i = 0; i < 15; i++) { act(() => vi.advanceTimersByTime(1000)); hook.rerender(); }
    expect(advance).toHaveBeenCalledTimes(1);
  });
  it('pauses and resumes the remaining time instead of starting over', () => {
    vi.useFakeTimers(); const advance = vi.fn();
    const hook = renderHook(({paused}) => useTourPlayback('slide', paused, 15, advance), {initialProps:{paused:false}});
    act(() => vi.advanceTimersByTime(10000)); hook.rerender({paused:true});
    act(() => vi.advanceTimersByTime(30000)); expect(advance).not.toHaveBeenCalled();
    hook.rerender({paused:false}); act(() => vi.advanceTimersByTime(5200)); expect(advance).toHaveBeenCalledTimes(1);
  });
  it('waits for Voyager 1 launch range and resets elapsed time for the next slide', () => {
    const stop = leftBehindTours.find(t => t.id === 'voyager-1')?.stops[0];
    expect(stop).toBeDefined(); if (!stop) return;
    expect(tourSlideSeconds(stop, true)).toBeCloseTo(19.125);
    vi.useFakeTimers(); const advance = vi.fn();
    const hook = renderHook(({key}) => useTourPlayback(key, false, 15, advance), {initialProps:{key:'one'}});
    act(() => vi.advanceTimersByTime(10000)); hook.rerender({key:'two'});
    act(() => vi.advanceTimersByTime(10000)); expect(advance).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5000)); expect(advance).toHaveBeenCalledTimes(1);
  });
});