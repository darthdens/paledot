// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { create } from 'zustand';
import { advanceDate, CLOCK_RATES, CLOCK_START, CLOCK_END } from '../engine/clock';
type SimClock = {
  simDate: number; isPlaying: boolean; rate: number; dateControlOpen: boolean;
  preTour: { isPlaying: boolean; rate: number } | null;
  setSimDate: (date: number) => void; togglePlaying: () => void;
  setRate: (rate: number) => void; changeSpeed: (direction: number) => void;
  advanceClock: (seconds: number) => void; setDateControlOpen: (open: boolean) => void;
  pauseForTour: () => void; restoreAfterTour: () => void;
};
export const useSimClock = create<SimClock>((set, get) => ({
  simDate: Date.now(), isPlaying: true, rate: 1, dateControlOpen: false, preTour: null,
  setSimDate: date => { if (Number.isFinite(date)) set({ simDate: Math.min(CLOCK_END, Math.max(CLOCK_START, date)) }); },
  togglePlaying: () => { if (!get().preTour) set(s => ({ isPlaying: !s.isPlaying })); },
  setRate: rate => { if (CLOCK_RATES.some(value => value === rate)) set({ rate }); },
  changeSpeed: direction => {
    const index = CLOCK_RATES.findIndex(rate => rate === get().rate);
    const rate = CLOCK_RATES[Math.max(0, Math.min(CLOCK_RATES.length - 1, index + direction))];
    if (rate !== undefined) set({ rate });
  },
  advanceClock: seconds => { const s = get(); if (s.isPlaying) set({ simDate: advanceDate(s.simDate, seconds, s.rate) }); },
  setDateControlOpen: dateControlOpen => set({ dateControlOpen }),
  pauseForTour: () => { const s = get(); if (!s.preTour) set({ preTour: { isPlaying: s.isPlaying, rate: s.rate }, isPlaying: false }); },
  restoreAfterTour: () => { const s = get(); if (s.preTour) set({ ...s.preTour, preTour: null }); },
}));
