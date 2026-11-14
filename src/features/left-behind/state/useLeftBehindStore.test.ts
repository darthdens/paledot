// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { afterEach, expect, it } from 'vitest';
import { useLeftBehindStore } from './useLeftBehindStore';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { eclipticKmToScene, UNIFIED_SCALE } from '../lib/units';

afterEach(() => useLeftBehindStore.getState().exit());
it('queues title/hash entry without activating before boot', () => {
  useLeftBehindStore.getState().requestEntry();
  expect(useLeftBehindStore.getState().pendingEntry).toBe(true);
  expect(useLeftBehindStore.getState().active).toBe(false);
  useLeftBehindStore.getState().enter();
  expect(useLeftBehindStore.getState().active).toBe(true);
  expect(useLeftBehindStore.getState().pendingEntry).toBe(false);
});
it('enter and exit leave existing exploration time and tour controls unchanged', () => {
  const before = useCosmosStore.getState();
  const values = [before.timeSpeed, before.isTouring, before.tourIndex, before.selectedObject];
  useLeftBehindStore.getState().enter();
  useLeftBehindStore.getState().exit();
  const after = useCosmosStore.getState();
  expect([after.timeSpeed, after.isTouring, after.tourIndex, after.selectedObject]).toEqual(values);
  expect(useLeftBehindStore.getState().active).toBe(false);
});
it('maps ecliptic kilometres with the single required orientation and scale', () => {
  expect(UNIFIED_SCALE).toBe(0.001);
  expect(eclipticKmToScene(1000, 2000, 3000)).toEqual([1, 3, -2]);
});