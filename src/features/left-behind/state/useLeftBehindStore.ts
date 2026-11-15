// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
type LeftBehindState = {
  machinesVisible: boolean; menuOpen: boolean;
  framingView: 'intro' | 'machines' | 'knowledge' | 'summary' | null;
  openFraming: (view: 'intro' | 'machines' | 'knowledge' | 'summary') => void;
  fullPathsVisible: boolean;
  selectedHardwareId: string | null; followTargetId: string | null;
  activeTourId: string | null; tourStepIndex: number;
  setMenuOpen: (open: boolean) => void; toggleMachines: () => void;
  toggleFullPaths: () => void; selectHardware: (id: string | null) => void;
  toggleHardwareFollow: () => void;
  surfaceViewNonce: number; requestSurfaceView: () => void;
  /** Tour-set camera distance for the next follow flight (km); null = machine default. */
  followDistanceKm: number | null; followNonce: number;
  /** Tour requested by a #lb-<id> link, started once loading finishes. */
  pendingTourId: string | null;
  pendingStopId: string | null;
  tourFollow: (id: string, distanceKm: number | null) => void;
};
export const useLeftBehindStore = create<LeftBehindState>(set => ({
  machinesVisible: true, menuOpen: false, selectedHardwareId: null,
  framingView: null,
  openFraming: framingView => set({ framingView, menuOpen: false }),
  fullPathsVisible: false,
  followTargetId: null, activeTourId: null, tourStepIndex: 0,
  setMenuOpen: menuOpen => set({ menuOpen }),
  toggleMachines: () => set(s => ({ machinesVisible: !s.machinesVisible, selectedHardwareId: null, followTargetId: null })),
  toggleFullPaths: () => set(s => ({ fullPathsVisible: !s.fullPathsVisible })),
  selectHardware: id => set({ selectedHardwareId: id, followTargetId: id, followDistanceKm: null }),
  surfaceViewNonce: 0, followDistanceKm: null, followNonce: 0, pendingTourId: null, pendingStopId: null,
  tourFollow: (id, followDistanceKm) => set(s => ({ followDistanceKm, followNonce: s.followNonce + 1, selectedHardwareId: id, followTargetId: id })),
  requestSurfaceView: () => set(s => ({ surfaceViewNonce: s.surfaceViewNonce + 1, followTargetId: s.selectedHardwareId })),
  toggleHardwareFollow:()=>set(s=>({followTargetId:s.followTargetId?null:s.selectedHardwareId})),
}));
