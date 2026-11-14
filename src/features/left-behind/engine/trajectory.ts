// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { getTrajectory } from '../data/dataClient';
import type { Trajectory } from '../data/types';
import { helioPositionKm, moonPositionKm } from './ephemeris';

export type Km = [number, number, number];
export type TrackPosition = { km: Km; source: Trajectory['source']; extrapolated: boolean };
const loaded = new Map<string, Trajectory>();
const pending = new Map<string, Promise<Trajectory>>();
export function loadTrajectory(id: string) {
  let promise = pending.get(id);
  if (!promise) {
    promise = getTrajectory(id).then(data => { loaded.set(id, data); return data; }).catch(error => { pending.delete(id); throw error; });
    pending.set(id, promise);
  }
  return promise;
}
export function getLoadedTrajectory(id: string) { return loaded.get(id); }

/** Pure evaluator; all coordinates remain heliocentric ecliptic J2000 kilometres. */
export function evaluateTrajectory(data: Trajectory, date: Date): TrackPosition | null {
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  if (data.source === 'simplified') {
    const m = data.milestones;
    if (!m?.arrival || (m.arrivalBody !== 'moon' && m.arrivalBody !== 'mars')) return null;
    const start = Date.parse(m.launch), end = Date.parse(m.arrival);
    if (time < start || time > end || end <= start) return null;
    const t = (time - start) / (end - start);
    const earthStart = helioPositionKm('earth', new Date(start));
    const earthEnd = helioPositionKm('earth', new Date(end));
    const arrival = m.arrivalBody === 'moon' ? moonPositionKm(new Date(end)) : helioPositionKm('mars', new Date(end));
    const from: Km = m.center === 'earth' ? [0, 0, 0] : earthStart;
    const to: Km = m.center === 'earth' ? arrival.map((v, i) => v - (earthEnd[i] ?? 0)) as Km : arrival;
    // A schematic bowed arc, explicitly labelled simplified, never a reconstructed flight.
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const control: Km = [(from[0] + to[0]) / 2 - dy * .25, (from[1] + to[1]) / 2 + dx * .25, (from[2] + to[2]) / 2];
    const center: Km = m.center === 'earth' ? helioPositionKm('earth', date) : [0, 0, 0];
    const km = from.map((v, i) => (1-t)**2*v + 2*(1-t)*t*(control[i] ?? 0) + t*t*(to[i] ?? 0) + (center[i] ?? 0)) as Km;
    return { km, source: data.source, extrapolated: false };
  }
  const segments = data.segments ?? [];
  const covering = segments.filter(s => s.positions.length && s.stepSeconds > 0 && time >= Date.parse(s.start) && time <= Date.parse(s.start) + (s.positions.length-1)*s.stepSeconds*1000).sort((a,b) => a.stepSeconds-b.stepSeconds);
  const segment = covering[0];
  if (segment) {
    const index = (time-Date.parse(segment.start))/(segment.stepSeconds*1000);
    const low = Math.floor(index), fraction = index-low;
    const a = segment.positions[low], b = segment.positions[Math.min(low+1,segment.positions.length-1)];
    if (!a || !b || a.length < 3 || b.length < 3) return null;
    const center: Km = segment.center === 'sun' ? [0,0,0] : helioPositionKm(segment.center,date);
    return { km: [0,1,2].map(i => (a[i] ?? 0) + ((b[i] ?? 0)-(a[i] ?? 0))*fraction + (center[i] ?? 0)) as Km, source:data.source, extrapolated:false };
  }
  if (data.id !== 'voyager-1' && data.id !== 'voyager-2') return null;
  const last = [...segments].filter(s => s.positions.length >= 2).sort((a,b) => (Date.parse(b.start)+(b.positions.length-1)*b.stepSeconds*1000)-(Date.parse(a.start)+(a.positions.length-1)*a.stepSeconds*1000))[0];
  if (!last) return null;
  const end = Date.parse(last.start)+(last.positions.length-1)*last.stepSeconds*1000;
  if (time <= end) return null; // gaps are not interpolated
  const a = evaluateTrajectory(data,new Date(end-last.stepSeconds*1000));
  const b = evaluateTrajectory(data,new Date(end));
  if (!a || !b) return null;
  const factor = (time-end)/(last.stepSeconds*1000);
  return { km: b.km.map((v,i) => v+(v-(a.km[i] ?? 0))*factor) as Km, source:data.source, extrapolated:true };
}
export function positionAt(id: string, date: Date) {
  const data = loaded.get(id);
  return data ? evaluateTrajectory(data,date) : null;
}
export function sampleTrajectory(data: Trajectory): { time: number; km: Km }[] {
  const times = new Set<number>();
  if (data.source === 'simplified' && data.milestones?.arrival) {
    const start = Date.parse(data.milestones.launch), end = Date.parse(data.milestones.arrival);
    for (let i=0;i<=256;i++) times.add(start+(end-start)*i/256);
  } else for (const s of data.segments ?? []) for (let i=0;i<s.positions.length;i++) times.add(Date.parse(s.start)+i*s.stepSeconds*1000);
  return [...times].sort((a,b)=>a-b).flatMap(time => { const p=evaluateTrajectory(data,new Date(time));return p ? [{time,km:p.km}] : []; });
}
export function measurementsAt(id: string, date: Date) {
  const p = positionAt(id,date);
  if (!p) return null;
  const earth = helioPositionKm('earth',date);
  const earthKm = Math.hypot(...p.km.map((v,i)=>v-(earth[i] ?? 0)));
  const before=positionAt(id,new Date(date.getTime()-60000)), after=positionAt(id,new Date(date.getTime()+60000));
  const speed = before && after ? Math.hypot(...after.km.map((v,i)=>v-(before.km[i] ?? 0)))/120 : null;
  return { ...p, sunKm:Math.hypot(...p.km), earthKm, lightSeconds:earthKm/299792.458, speed };
}