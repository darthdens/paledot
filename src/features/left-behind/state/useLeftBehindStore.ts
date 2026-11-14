// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';

type LeftBehindState = {
  active: boolean; pendingEntry: boolean; simDate: number; isPlaying: boolean;
  playbackRate: number; selectedHardwareId: string | null; followTargetId: string | null;
  activeTourId: string | null; tourStepIndex: number;
  enter: () => void; exit: () => void; requestEntry: () => void;
};
export const useLeftBehindStore = create<LeftBehindState>((set) => ({
  active: false, pendingEntry: false, simDate: Date.now(), isPlaying: false,
  playbackRate: 1, selectedHardwareId: null, followTargetId: null,
  activeTourId: null, tourStepIndex: 0,
  enter: () => set({ active: true, pendingEntry: false }),
  exit: () => set({ active: false, pendingEntry: false, activeTourId: null, tourStepIndex: 0, followTargetId: null, selectedHardwareId: null }),
  requestEntry: () => set({ pendingEntry: true }),
}));