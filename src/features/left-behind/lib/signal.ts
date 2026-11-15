// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { helioPositionKm, moonPositionKm } from '../engine/ephemeris';
import { evaluateTrajectory } from '../engine/trajectory';
import type { Machine, Trajectory } from '../data/types';
export const LIGHT_KM_S = 299792.458;
export const SIGNAL_KEY = 'pd-signal-v1';
export type SignalMachine = Machine & { status?: { type: string; since: string | null }; facts?: { id: string; text: string; sourceUrl: string }[] };
export type SignalRow = { id: string; name: string; distanceKm: number; direction: [number, number, number]; provenance: 'ephemeris' | 'horizons'; extrapolated: boolean; status: string; since: string | null; sourceUrl: string };
export type SignalRace = { version: 1; sentAt: number; message: string; earthKm: [number, number, number]; rows: SignalRow[] };
export const lightSeconds = (km: number) => km / LIGHT_KM_S;
export const remainingSeconds = (race: SignalRace, row: SignalRow, now: number) => Math.max(0, lightSeconds(row.distanceKm) - Math.max(0, now - race.sentAt) / 1000);
export const signalProgress = (race: SignalRace, row: SignalRow, now: number) => Math.min(1, Math.max(0, (now - race.sentAt) / 1000 / lightSeconds(row.distanceKm)));
/** One shared Earth-to-farthest logarithmic axis, not seven independently scaled distances. */
export const logDistance = (km: number, maxKm: number) => Math.log1p(Math.max(0, km)) / Math.log1p(maxKm);
export const shortMessage = (message: string) => Array.from(message).slice(0, 40).join('');
export function buildSignalRace(machines: SignalMachine[], tracks: Trajectory[], now: number, message: string): SignalRace {
  const date = new Date(now), earthKm = helioPositionKm('earth', date);
  const rows = machines.map(machine => {
    const body = machine.body;
    const track = tracks.find(t => t.id === machine.id);
    const evaluated = track ? evaluateTrajectory(track, date) : null;
    const target = body === 'moon' ? moonPositionKm(date) : body === 'mars' ? helioPositionKm('mars', date) : evaluated?.km;
    if (!target || (!body && evaluated?.source !== 'horizons')) throw new Error(`TODO(source): ${machine.id}`);
    const delta = target.map((v, i) => v - (earthKm[i] ?? 0));
    const distanceKm = Math.hypot(...delta);
    return { id: machine.id, name: machine.name, distanceKm, direction: delta.map(v => v / distanceKm) as [number, number, number], provenance: body ? 'ephemeris' as const : 'horizons' as const, extrapolated: evaluated?.extrapolated ?? false, status: machine.status?.type ?? 'unknown', since: machine.status?.since ?? null, sourceUrl: machine.facts?.[0]?.sourceUrl ?? '' };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
  return { version: 1, sentAt: now, message: shortMessage(message), earthKm, rows };
}
export function saveRace(race: SignalRace | null, storage: Pick<Storage, 'setItem' | 'removeItem'>) {
  try { if (race) storage.setItem(SIGNAL_KEY, JSON.stringify(race)); else storage.removeItem(SIGNAL_KEY); } catch { /* Private browsing: this visit still works. */ }
}
export function restoreRace(storage: Pick<Storage, 'getItem'>): SignalRace | null {
  try {
    const value = JSON.parse(storage.getItem(SIGNAL_KEY) ?? 'null') as SignalRace | null;
    if (!value || value.version !== 1 || !Number.isFinite(value.sentAt) || typeof value.message !== 'string' || !Array.isArray(value.earthKm) || value.earthKm.length !== 3 || !value.earthKm.every(Number.isFinite) || !Array.isArray(value.rows) || value.rows.length !== 7) return null;
    if (!value.rows.every(row => typeof row.id === 'string' && typeof row.name === 'string' && Number.isFinite(row.distanceKm) && row.distanceKm > 0 && Array.isArray(row.direction) && row.direction.length === 3 && row.direction.every(Number.isFinite) && ['ephemeris','horizons'].includes(row.provenance))) return null;
    return value;
  } catch { return null; }
}
export const countdown = (seconds: number) => {
  const s = Math.ceil(seconds);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':');
};
