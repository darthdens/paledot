// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export const CLOCK_START = Date.UTC(1969, 6, 1);
export const CLOCK_DAY_MS = 86400000;
export const CLOCK_RATES = [1, 30, 365] as const;
export function advanceDate(date: number, seconds: number, rate: number, today: number) {
  return Math.min(today, Math.max(CLOCK_START, date + Math.max(0, seconds) * rate * CLOCK_DAY_MS));
}