// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useFrame } from '@react-three/fiber';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
export function SimulationClock() {
  useFrame((_, delta) => {
    const state = useLeftBehindStore.getState();
    if (state.active && state.isPlaying) state.advanceClock(delta);
  }, -2);
  return null;
}