// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
import type { SignalRace } from '../lib/signal';
import { useLeftBehindStore } from './useLeftBehindStore';
export const useSignal = create<{ open: boolean; targetId: string; race: SignalRace | null; setRace: (race: SignalRace | null) => void; show: (id?: string) => void; close: () => void }>(set => ({
  open: false, targetId: 'voyager-1', race: null,
  setRace: race => set({ race }),
  show: id => { useLeftBehindStore.getState().setMenuOpen(false); set(s => ({ open: true, targetId: id ?? s.targetId })); },
  close: () => set({ open: false }),
}));
