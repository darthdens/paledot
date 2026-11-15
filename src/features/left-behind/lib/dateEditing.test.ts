// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect, it } from 'vitest';
import { replaceUtcDay, replaceUtcTime } from './dateEditing';
it('changing the calendar keeps the UTC time unchanged', () => {
  expect(replaceUtcDay(Date.UTC(2026,10,15,17,45,5), new Date(1990,1,14))).toBe(Date.UTC(1990,1,14,17,45,5));
});
it('changing UTC time keeps the selected day and other time parts', () => {
  expect(replaceUtcTime(Date.UTC(1990,1,14,17,45,5), 'hour', 23)).toBe(Date.UTC(1990,1,14,23,45,5));
  expect(replaceUtcTime(Date.UTC(1990,1,14,17,45,5), 'minute', 59)).toBe(Date.UTC(1990,1,14,17,59,5));
  expect(replaceUtcTime(Date.UTC(1990,1,14,17,45,5), 'second', 0)).toBe(Date.UTC(1990,1,14,17,45,0));
});
it('rejects invalid hours and minutes without rolling to another day', () => {
  const time = Date.UTC(2026,10,15,17,45,5);
  expect(replaceUtcTime(time, 'hour', 24)).toBe(time);
  expect(replaceUtcTime(time, 'minute', 60)).toBe(time);
});