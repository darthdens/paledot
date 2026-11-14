// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export const CLOCK_START = Date.UTC(1957, 0, 1);
export const CLOCK_END = Date.UTC(2101, 0, 1) - 1;
export const CLOCK_DAY_MS = 86400000;
// Fixed month/year durations: 30 days and 365.25 days.
export const CLOCK_RATES = [1, 3600, 86400, 2592000, 31557600] as const;
export function advanceDate(date: number, seconds: number, rate: number, end = CLOCK_END) {
  return Math.min(end, Math.max(CLOCK_START, date + Math.max(0, seconds) * rate * 1000));
}
