// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildSignalRace, lightSeconds, LIGHT_KM_S, logDistance, remainingSeconds, restoreRace, saveRace, shortMessage, signalProgress, signalPositionKm } from './signal';
import type { SignalMachine } from './signal';
import type { Trajectory } from '../data/types';
const machines = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8')).machines as SignalMachine[];
const tracks = ['voyager-1', 'voyager-2'].map(id => JSON.parse(readFileSync(`public/left-behind/trajectories/${id}.json`, 'utf8')) as Trajectory);
const time = Date.parse('2026-11-15T03:58:00Z');
const race = buildSignalRace(machines, tracks, time, 'Hello');
describe('Send a signal physical rules', () => {
 it('uses exactly 299,792.458 km per second', () => expect(LIGHT_KM_S).toBe(299792.458));
 it('moves the pulse exactly 299,792.458 km in one real second', () => {
  const row = race.rows.find(r => r.id === 'voyager-1'); if (!row) throw new Error('missing row');
  const p = signalPositionKm(race, row, time + 1000);
  expect(Math.hypot(...p.map((v, i) => v - (race.earthKm[i] ?? 0)))).toBeCloseTo(299792.458, 5);
 });
 it('Moon light time is about 1.3 seconds', () => {
  const row = race.rows.find(r => r.id === 'apollo-11');
  expect(lightSeconds(row?.distanceKm ?? 0)).toBeGreaterThan(1.1);
  expect(lightSeconds(row?.distanceKm ?? Infinity)).toBeLessThan(1.5);
 });
 it('Mars light time lies between about 3 and 22 minutes today', () => {
  const row = race.rows.find(r => r.id === 'viking-1');
  expect(lightSeconds(row?.distanceKm ?? 0)).toBeGreaterThan(3 * 60);
  expect(lightSeconds(row?.distanceKm ?? Infinity)).toBeLessThan(22 * 60);
 });
 it('Voyager 1 is at least 23 light-hours away', () => expect(lightSeconds(race.rows.find(r => r.id === 'voyager-1')?.distanceKm ?? 0)).toBeGreaterThan(23 * 3600));
 it('races to seven machines ordered by Earth-relative distance', () => {
  expect(race.rows).toHaveLength(7);
  expect(race.rows.map(r => r.distanceKm)).toEqual(race.rows.map(r => r.distanceKm).sort((a,b) => a-b));
 });
 it('all distances carry source provenance and Voyager extrapolation when beyond the data end', () => {
  expect(race.rows.filter(r => r.provenance === 'ephemeris')).toHaveLength(5);
  expect(race.rows.filter(r => r.provenance === 'horizons')).toHaveLength(2);
  const v = tracks.find(t => t.id === 'voyager-1');
  if (!v) throw new Error('missing track');
  const end = Math.max(...(v.segments ?? []).map(s => Date.parse(s.start) + (s.positions.length - 1) * s.stepSeconds * 1000));
  const future = buildSignalRace(machines, tracks, end + 86400000, '');
  expect(future.rows.find(r => r.id === 'voyager-1')?.extrapolated).toBe(true);
 });
 it('limits the optional message to 40 characters', () => expect(Array.from(shortMessage('🌍'.repeat(41)))).toHaveLength(40));
 it('progress uses elapsed real milliseconds, not a simulated date', () => {
  const row = race.rows[0]; if (!row) throw new Error('missing row');
  const halfway = race.sentAt + lightSeconds(row.distanceKm) * 500;
  expect(signalProgress(race, row, halfway)).toBeCloseTo(.5);
  expect(remainingSeconds(race, row, halfway)).toBeCloseTo(lightSeconds(row.distanceKm) / 2);
 });
 it('uses one logarithmic Earth-to-farthest axis', () => {
  expect(logDistance(0, 26e9)).toBe(0);
  expect(logDistance(26e9, 26e9)).toBe(1);
  expect(logDistance(380000, 26e9)).toBeGreaterThan(.5);
 });
 it('restores the send time so a return visit reads real progress', () => {
  const storage = { value: '', setItem(_k: string, v: string) { this.value = v; }, getItem() { return this.value; }, removeItem() { this.value = ''; } };
  saveRace(race, storage);
  const saved = restoreRace(storage);
  expect(saved?.sentAt).toBe(time);
  const row = saved?.rows[0]; if (!saved || !row) throw new Error('missing saved race');
  expect(remainingSeconds(saved, row, time + 10000)).toBe(0);
  saveRace(null, storage); expect(restoreRace(storage)).toBeNull();
 });
 it('survives denied or corrupt browser storage', () => {
  expect(restoreRace({ getItem() { throw new Error('denied'); } })).toBeNull();
  expect(() => saveRace(race, { setItem() { throw new Error('denied'); }, removeItem() {} })).not.toThrow();
  expect(restoreRace({ getItem: () => '{bad' })).toBeNull();
 });
});
