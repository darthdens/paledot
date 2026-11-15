// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useFrame } from '@react-three/fiber';
import { tickSimulationClock } from '../engine/clockDriver';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
export function SimulationClock() {
  useFrame(() => {
    const tour = useCosmosStore.getState();
    tickSimulationClock(Date.now(), tour.isTouring && tour.isPaused);
  }, -2);
  return null;
}
