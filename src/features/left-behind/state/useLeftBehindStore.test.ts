// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect, it } from 'vitest';
import { useLeftBehindStore } from './useLeftBehindStore';
import { useSimClock } from './useSimClock';
import { eclipticKmToScene, UNIFIED_SCALE } from '../lib/units';
it('machines are visible by default without any mode flag', () => {
  expect(useLeftBehindStore.getInitialState().machinesVisible).toBe(true);
  expect(useLeftBehindStore.getState()).not.toHaveProperty('active');
});
it('opening and closing the menu never changes the shared clock', () => {
  const before = useSimClock.getState();
  useLeftBehindStore.getState().setMenuOpen(true); expect(useLeftBehindStore.getState().menuOpen).toBe(true);
  useLeftBehindStore.getState().setMenuOpen(false);
  expect(useSimClock.getState()).toBe(before);
});
it('machine visibility changes independently of the menu and clock', () => {
  useLeftBehindStore.getState().toggleMachines(); expect(useLeftBehindStore.getState().machinesVisible).toBe(false);
  useLeftBehindStore.getState().toggleMachines(); expect(useLeftBehindStore.getState().machinesVisible).toBe(true);
});
it('maps ecliptic kilometres with the single required orientation and scale', () => {
  expect(UNIFIED_SCALE).toBe(0.001);
  expect(eclipticKmToScene(1000,2000,3000)).toEqual([1,3,-2]);
});
it('hiding machines clears only hardware following and preserves clock state', () => {
  const clock=useSimClock.getState();
  useLeftBehindStore.getState().selectHardware('voyager-1');
  expect(useLeftBehindStore.getState().followTargetId).toBe('voyager-1');
  useLeftBehindStore.getState().toggleMachines();
  expect(useLeftBehindStore.getState().selectedHardwareId).toBeNull();
  expect(useLeftBehindStore.getState().followTargetId).toBeNull();
  expect(useSimClock.getState()).toBe(clock);
  useLeftBehindStore.getState().toggleMachines();
});
it('unfollowing a machine keeps its selection and restores following when requested',()=>{
  useLeftBehindStore.getState().selectHardware('voyager-1');
  useLeftBehindStore.getState().toggleHardwareFollow();
  expect(useLeftBehindStore.getState().selectedHardwareId).toBe('voyager-1');
  expect(useLeftBehindStore.getState().followTargetId).toBeNull();
  useLeftBehindStore.getState().toggleHardwareFollow();
  expect(useLeftBehindStore.getState().followTargetId).toBe('voyager-1');
  useLeftBehindStore.getState().selectHardware(null);
});
