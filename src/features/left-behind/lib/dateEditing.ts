// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export function replaceUtcDay(timestamp: number, date: Date) {
  const current = new Date(timestamp);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds(), current.getUTCMilliseconds());
}
export function replaceUtcTime(timestamp: number, part: 'hour' | 'minute' | 'second', value: number) {
  const current = new Date(timestamp);
  const limit = part === 'hour' ? 23 : 59;
  if (!Number.isInteger(value) || value < 0 || value > limit) return timestamp;
  if (part === 'hour') current.setUTCHours(value);
  if (part === 'minute') current.setUTCMinutes(value);
  if (part === 'second') current.setUTCSeconds(value);
  return current.getTime();
}