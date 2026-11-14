// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
type LeftBehindState = {
  machinesVisible: boolean; menuOpen: boolean;
  fullPathsVisible: boolean;
  selectedHardwareId: string | null; followTargetId: string | null;
  activeTourId: string | null; tourStepIndex: number;
  setMenuOpen: (open: boolean) => void; toggleMachines: () => void;
  toggleFullPaths: () => void; selectHardware: (id: string | null) => void;
};
export const useLeftBehindStore = create<LeftBehindState>(set => ({
  machinesVisible: true, menuOpen: false, selectedHardwareId: null,
  fullPathsVisible: false,
  followTargetId: null, activeTourId: null, tourStepIndex: 0,
  setMenuOpen: menuOpen => set({ menuOpen }),
  toggleMachines: () => set(s => ({ machinesVisible: !s.machinesVisible, selectedHardwareId: null, followTargetId: null })),
  toggleFullPaths: () => set(s => ({ fullPathsVisible: !s.fullPathsVisible })),
  selectHardware: id => set({ selectedHardwareId: id, followTargetId: id }),
}));
