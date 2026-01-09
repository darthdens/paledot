import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScaleLevel, CelestialObject, SCALE_BOUNDARIES } from '../types';

export type AnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface TourCameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

interface CosmosStore {
  // Camera state
  cameraDistance: number;
  currentScale: ScaleLevel;
  targetPosition: [number, number, number];

  // Runtime positions (used for moving/orbiting bodies)
  objectWorldPositions: Record<string, [number, number, number]>;

  // Selection
  selectedObject: CelestialObject | null;
  hoveredObject: CelestialObject | null;

  // Following
  isFollowing: boolean;

  // Tour
  isTouring: boolean;
  tourIndex: number;
  tourSpeed: number;
  isPaused: boolean;
  tourCameraTarget: TourCameraTarget | null;

  // UI
  showControlHints: boolean;
  showQuickJump: boolean;
  quickJumpAnchorRect: AnchorRect | null;
  showSizeComparison: boolean;
  showOrbits: boolean;
  showTrails: boolean;
  showRealPeriods: boolean;
  showPerformanceHUD: boolean;
  useExaggeratedScale: boolean;
  recentJumps: string[];

  // Audio
  isMuted: boolean;
  volume: number;

  // Time travel
  timeOffset: number; // Years from present
  timeSpeed: number; // Multiplier for orbit/rotation speed (1 = normal)

  // Actions
  setCameraDistance: (distance: number) => void;
  setCurrentScale: (scale: ScaleLevel) => void;
  setTargetPosition: (position: [number, number, number]) => void;

  setObjectWorldPosition: (objectId: string, position: [number, number, number]) => void;
  getObjectWorldPosition: (objectId: string) => [number, number, number] | null;

  setSelectedObject: (object: CelestialObject | null) => void;
  setHoveredObject: (object: CelestialObject | null) => void;
  setIsFollowing: (following: boolean) => void;
  toggleFollowing: () => void;
  startTour: () => void;
  stopTour: () => void;
  setTourIndex: (index: number) => void;
  setTourSpeed: (speed: number) => void;
  setTourCameraTarget: (target: TourCameraTarget | null) => void;
  togglePause: () => void;
  setShowControlHints: (show: boolean) => void;
  setQuickJumpAnchorRect: (rect: AnchorRect | null) => void;
  toggleQuickJump: () => void;
  toggleSizeComparison: () => void;
  toggleOrbits: () => void;
  toggleTrails: () => void;
  toggleRealPeriods: () => void;
  togglePerformanceHUD: () => void;
  toggleExaggeratedScale: () => void;
  addRecentJump: (objectId: string) => void;
  jumpToObject: (object: CelestialObject) => void;
  goHome: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setTimeOffset: (offset: number) => void;
  setTimeSpeed: (speed: number) => void;
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

      objectWorldPositions: {},
      
      selectedObject: null,
      hoveredObject: null,

      isFollowing: true,
      
      isTouring: false,
      tourIndex: 0,
      tourSpeed: 1,
      isPaused: false,
      tourCameraTarget: null,
      
      showControlHints: true,
      showQuickJump: false,
      quickJumpAnchorRect: null,
      showSizeComparison: false,
      showOrbits: true,
      showTrails: true,
      showRealPeriods: false,
      showPerformanceHUD: false,

      useExaggeratedScale: true,
      recentJumps: [],

      isMuted: false,
      volume: 0.5,
      
      timeOffset: 0,
      timeSpeed: 1,
      
      // Actions
      setCameraDistance: (distance) => {
        const scale = getScaleFromDistance(distance);
        set({ cameraDistance: distance, currentScale: scale });
      },
      
      setCurrentScale: (scale) => set({ currentScale: scale }),
      
      setTargetPosition: (position) => set({ targetPosition: position }),

      setObjectWorldPosition: (objectId, position) =>
        set((state) => ({
          objectWorldPositions: {
            ...state.objectWorldPositions,
            [objectId]: position,
          },
        })),

      getObjectWorldPosition: (objectId) => get().objectWorldPositions[objectId] ?? null,
      
      setSelectedObject: (object) => set({ selectedObject: object, isFollowing: true }),
      
      setHoveredObject: (object) => set({ hoveredObject: object }),

      setIsFollowing: (following) => set({ isFollowing: following }),

      toggleFollowing: () => set((state) => ({ isFollowing: !state.isFollowing })),
      
      startTour: () => set({ isTouring: true, tourIndex: 0, isPaused: false, tourCameraTarget: null }),
      
      stopTour: () => set({ isTouring: false, tourIndex: 0, tourCameraTarget: null }),
      
      setTourIndex: (index) => set({ tourIndex: index }),
      
      setTourSpeed: (speed) => set({ tourSpeed: speed }),
      
      setTourCameraTarget: (target) => set({ tourCameraTarget: target }),
      
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      
      setShowControlHints: (show) => set({ showControlHints: show }),

      setQuickJumpAnchorRect: (rect) => set({ quickJumpAnchorRect: rect }),
      
      toggleQuickJump: () => set((state) => ({ showQuickJump: !state.showQuickJump })),
      
      toggleSizeComparison: () => set((state) => ({ showSizeComparison: !state.showSizeComparison })),

      toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),

      toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),

      toggleRealPeriods: () => set((state) => ({ showRealPeriods: !state.showRealPeriods })),

      togglePerformanceHUD: () => set((state) => ({ showPerformanceHUD: !state.showPerformanceHUD })),

      toggleExaggeratedScale: () => set((state) => ({ useExaggeratedScale: !state.useExaggeratedScale })),
      
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

      goHome: () => {
        // Import celestialObjects inline to avoid circular dependency
        const { selectedObject } = get();
        // Find Earth from the current objects if available via selection
        // For simplicity, we create a minimal Earth object for navigation
        const earthObject: CelestialObject = {
          id: 'earth',
          name: { en: 'Earth', fr: 'Terre' },
          type: 'planet',
          position: [149597870.7, 0, 0], // 1 AU
          size: 12742,
          color: '#6b93d6',
          distanceFromEarth: 0,
          distanceUnit: 'km',
          category: 'solarSystem',
        };
        set({
          selectedObject: earthObject,
          isFollowing: true,
          showQuickJump: false,
        });
      },
      
      setMuted: (muted) => set({ isMuted: muted }),
      
      setVolume: (volume) => set({ volume }),
      
      setTimeOffset: (offset) => set({ timeOffset: offset }),
      
      setTimeSpeed: (speed) => set({ timeSpeed: speed }),
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
