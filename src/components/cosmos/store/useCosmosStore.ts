import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScaleLevel, CelestialObject, SCALE_BOUNDARIES } from '../types';

interface CosmosStore {
  // Camera state
  cameraDistance: number;
  currentScale: ScaleLevel;
  targetPosition: [number, number, number];
  
  // Selection
  selectedObject: CelestialObject | null;
  hoveredObject: CelestialObject | null;
  
  // Tour
  isTouring: boolean;
  tourIndex: number;
  tourSpeed: number;
  isPaused: boolean;
  
  // UI
  showControlHints: boolean;
  showQuickJump: boolean;
  showSizeComparison: boolean;
  recentJumps: string[];
  
  // Audio
  isMuted: boolean;
  volume: number;
  
  // Time travel
  timeOffset: number; // Years from present
  
  // Actions
  setCameraDistance: (distance: number) => void;
  setCurrentScale: (scale: ScaleLevel) => void;
  setTargetPosition: (position: [number, number, number]) => void;
  setSelectedObject: (object: CelestialObject | null) => void;
  setHoveredObject: (object: CelestialObject | null) => void;
  startTour: () => void;
  stopTour: () => void;
  setTourIndex: (index: number) => void;
  setTourSpeed: (speed: number) => void;
  togglePause: () => void;
  setShowControlHints: (show: boolean) => void;
  toggleQuickJump: () => void;
  toggleSizeComparison: () => void;
  addRecentJump: (objectId: string) => void;
  jumpToObject: (object: CelestialObject) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setTimeOffset: (offset: number) => void;
}

const getScaleFromDistance = (distance: number): ScaleLevel => {
  if (distance <= SCALE_BOUNDARIES.earth.max) return 'earth';
  if (distance <= SCALE_BOUNDARIES.solarSystem.max) return 'solarSystem';
  if (distance <= SCALE_BOUNDARIES.stellar.max) return 'stellar';
  if (distance <= SCALE_BOUNDARIES.milkyWay.max) return 'milkyWay';
  if (distance <= SCALE_BOUNDARIES.localGroup.max) return 'localGroup';
  return 'universe';
};

export const useCosmosStore = create<CosmosStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cameraDistance: 50000,
      currentScale: 'earth',
      targetPosition: [0, 0, 50000],
      
      selectedObject: null,
      hoveredObject: null,
      
      isTouring: false,
      tourIndex: 0,
      tourSpeed: 1,
      isPaused: false,
      
      showControlHints: true,
      showQuickJump: false,
      showSizeComparison: false,
      recentJumps: [],
      
      isMuted: false,
      volume: 0.5,
      
      timeOffset: 0,
      
      // Actions
      setCameraDistance: (distance) => {
        const scale = getScaleFromDistance(distance);
        set({ cameraDistance: distance, currentScale: scale });
      },
      
      setCurrentScale: (scale) => set({ currentScale: scale }),
      
      setTargetPosition: (position) => set({ targetPosition: position }),
      
      setSelectedObject: (object) => set({ selectedObject: object }),
      
      setHoveredObject: (object) => set({ hoveredObject: object }),
      
      startTour: () => set({ isTouring: true, tourIndex: 0, isPaused: false }),
      
      stopTour: () => set({ isTouring: false, tourIndex: 0 }),
      
      setTourIndex: (index) => set({ tourIndex: index }),
      
      setTourSpeed: (speed) => set({ tourSpeed: speed }),
      
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      
      setShowControlHints: (show) => set({ showControlHints: show }),
      
      toggleQuickJump: () => set((state) => ({ showQuickJump: !state.showQuickJump })),
      
      toggleSizeComparison: () => set((state) => ({ showSizeComparison: !state.showSizeComparison })),
      
      addRecentJump: (objectId) => {
        const { recentJumps } = get();
        const filtered = recentJumps.filter((id) => id !== objectId);
        set({ recentJumps: [objectId, ...filtered].slice(0, 5) });
      },
      
      jumpToObject: (object) => {
        const { addRecentJump } = get();
        addRecentJump(object.id);
        // Calculate camera position based on object
        const distance = Math.max(object.size * 5, 10000);
        const position: [number, number, number] = [
          object.position[0],
          object.position[1],
          object.position[2] + distance,
        ];
        set({
          targetPosition: position,
          selectedObject: object,
          showQuickJump: false,
        });
      },
      
      setMuted: (muted) => set({ isMuted: muted }),
      
      setVolume: (volume) => set({ volume }),
      
      setTimeOffset: (offset) => set({ timeOffset: offset }),
    }),
    {
      name: 'cosmos-storage',
      partialize: (state) => ({
        showControlHints: state.showControlHints,
        recentJumps: state.recentJumps,
        isMuted: state.isMuted,
        volume: state.volume,
      }),
    }
  )
);
