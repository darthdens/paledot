// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useFrame } from '@react-three/fiber';
import { useSimClock } from '../state/useSimClock';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
export function SimulationClock() {
  useFrame((_, delta) => {
    const tour = useCosmosStore.getState();
    if (tour.isTouring && tour.isPaused) return;
    useSimClock.getState().advanceClock(delta);
  }, -2);
  return null;
}
