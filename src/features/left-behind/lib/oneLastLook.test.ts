// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { LOOK_DATE, TURN_SECONDS, PORTRAIT_PLANETS, lookMeasurements, pixelWidths } from './oneLastLook';
import { useSimClock } from '../state/useSimClock';
import { leftBehindTours } from '../data/tours';
describe('One last look physical rules', () => {
  it('uses 14 February 1990 noon UTC', () => expect(new Date(LOOK_DATE).toISOString()).toBe('1990-02-14T12:00:00.000Z'));
  it('turns over three seconds', () => expect(TURN_SECONDS).toBe(3));
  it('marks only the six photographed planets', () => expect([...PORTRAIT_PLANETS]).toEqual(['venus', 'earth', 'jupiter', 'saturn', 'uranus', 'neptune']));
  it('uses one physical display pixel at 2x density', () => expect(pixelWidths(2).screen).toBe(.5));
  it('compares against 0.12 of the screen pixel', () => expect(pixelWidths(2).voyager).toBe(.06));
  it('calculates Earth angular size from diameter divided by distance', () => {
    const m = lookMeasurements([-2354970130.4, -4496911492.6, 3270063452.8], [-122009158.4550898, 83316000.93982047, 1967.206514000893], 12742);
    expect(m.distanceKm).toBeCloseTo(6054576840.2, -3);
    expect(m.angularRadians).toBeCloseTo(2.1045236e-6, 12);
    expect(m.angularRadians * 1800 / (2 * Math.tan(25 * Math.PI / 180))).toBeLessThan(1);
  });
  it('stops on a distance inconsistent with NASA', () => expect(() => lookMeasurements([1e9, 0, 0], [0, 0, 0], 12742)).toThrow());
  it('holds simulation time while the sequence plays', () => {
    useSimClock.getState().pauseForTour(); useSimClock.getState().setTourPlayback(LOOK_DATE);
    useSimClock.getState().advanceClock(30);
    expect(useSimClock.getState().simDate).toBe(LOOK_DATE);
    useSimClock.getState().holdAfterTour();
  });
  it('continues into heliopause, not the end frame', () => {
    const tour = leftBehindTours.find(t => t.id === 'voyager-1');
    const index = tour?.stops.findIndex(s => s.id === 'voyager-1-one-last-look') ?? -1;
    expect(tour?.stops[index + 1]?.id).toBe('voyager-1-heliopause');
    expect(tour?.onEnd).toBe('left-behind-summary');
  });
});