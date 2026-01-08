import { create } from 'zustand';

interface FullscreenStore {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

export const useFullscreenStore = create<FullscreenStore>((set) => ({
  isFullscreen: false,
  setIsFullscreen: (value) => set({ isFullscreen: value }),
}));
