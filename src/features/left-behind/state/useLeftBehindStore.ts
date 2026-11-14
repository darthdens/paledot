// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
import { advanceDate, CLOCK_RATES, CLOCK_START } from '../engine/clock';

type LeftBehindState = {
  active: boolean; pendingEntry: boolean; simDate: number; isPlaying: boolean;
  playbackRate: number; selectedHardwareId: string | null; followTargetId: string | null;
  activeTourId: string | null; tourStepIndex: number;
  dateControlOpen: boolean;
  setSimDate: (date: number) => void; togglePlaying: () => void;
  setPlaybackRate: (rate: number) => void; changeSpeed: (direction: number) => void;
  advanceClock: (seconds: number) => void; setDateControlOpen: (open: boolean) => void;
  enter: () => void; exit: () => void; requestEntry: () => void;
};
export const useLeftBehindStore = create<LeftBehindState>((set, get) => ({
  active: false, pendingEntry: false, simDate: CLOCK_START, isPlaying: false,
  playbackRate: 1, selectedHardwareId: null, followTargetId: null,
  activeTourId: null, tourStepIndex: 0,
  dateControlOpen: false,
  setSimDate: date => { if (Number.isFinite(date)) set({ simDate: Math.min(Date.now(), Math.max(CLOCK_START, date)) }); },
  togglePlaying: () => set(s => ({ isPlaying: !s.isPlaying })),
  setPlaybackRate: rate => { if (CLOCK_RATES.some(value => value === rate)) set({ playbackRate: rate }); },
  changeSpeed: direction => {
    const index = CLOCK_RATES.findIndex(rate => rate === get().playbackRate);
    const rate = CLOCK_RATES[Math.max(0, Math.min(CLOCK_RATES.length - 1, index + direction))];
    if (rate !== undefined) set({ playbackRate: rate });
  },
  advanceClock: seconds => {
    const state = get();
    if (!state.active || !state.isPlaying) return;
    const today = Date.now();
    const simDate = advanceDate(state.simDate, seconds, state.playbackRate, today);
    set({ simDate, isPlaying: simDate < today });
  },
  setDateControlOpen: dateControlOpen => set({ dateControlOpen }),
  enter: () => set({ active: true, pendingEntry: false, simDate: Date.now(), isPlaying: false, dateControlOpen: false }),
  exit: () => set({ active: false, pendingEntry: false, isPlaying: false, dateControlOpen: false, activeTourId: null, tourStepIndex: 0, followTargetId: null, selectedHardwareId: null }),
  requestEntry: () => set({ pendingEntry: true }),
}));