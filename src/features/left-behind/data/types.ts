// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export type TrajectorySettings = {
  id: string; horizonsTarget: string | null; lookup: string | null; fallback: string | null;
  center: string; arrivalBody?: string; launch?: string; arrival?: string;
  start?: string; stop?: string; encounters?: string[];
};
export type Machine = {
  id: string; name: string; kind?: string; launchDate: string; landingDate: string | null;
  followDistanceKm?: number;
  trajectories: TrajectorySettings[];
  photos: { nasaId?: string; query?: string; role?: string }[];
};
export type Segment = { center: 'sun' | 'earth' | 'mars'; start: string; stepSeconds: number; positions: number[][] };
export type Trajectory = {
  id: string; source: 'horizons' | 'simplified'; target?: string; query?: string[];
  retrievedAt?: string; frame?: string; units?: string; segments?: Segment[];
  milestones?: { launch: string; arrival: string | null; center: string; arrivalBody: string | null };
  note?: string;
};
export type Photo = {
  id: string; machineId: string; role?: string; nasaId: string; title: string;
  credit: string; sourceUrl: string; imageUrl: string; dateTaken: string | null;
  alt: string; caption: string; earthMarker?: null;
  todo?: boolean; note?: string; description?: string;
};