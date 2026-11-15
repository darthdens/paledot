// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { Machine } from '../data/types';
export function machineVisit(machine: Machine, simDate: number) {
  const existsAt = Date.parse(machine.landingDate ?? machine.launchDate);
  return { date: Math.max(simDate, existsAt), target: machine.trajectories[0]?.id ?? machine.id };
}
export const needsMachineSummary = (tourId: string) => tourId === 'voyager-1';