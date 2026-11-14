// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useFrame } from '@react-three/fiber';
import { useSimClock } from '../state/useSimClock';
export function SimulationClock() {
  useFrame((_, delta) => useSimClock.getState().advanceClock(delta), -2);
  return null;
}
