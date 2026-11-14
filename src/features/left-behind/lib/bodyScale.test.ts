// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { bodyRadius, bodyClearance, bodyFlyToDistance, closeViewNear, portraitFramingFactor } from './bodyScale';
import { celestialObjects } from '@/components/cosmos/data/celestialObjects';
import { tourStops } from '@/components/cosmos/data/tourStops';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';

describe('one true-scale universe', () => {
  it('renders Earth at 6.371 scene units', () => expect(bodyRadius(12742)).toBe(6.371));
  it('renders the Moon at 1.737 scene units without a moon boost', () => expect(bodyRadius(3474)).toBe(1.737));
  it('renders the Sun and Proxima without diameter-as-radius or stellar boosts', () => {
    expect(bodyRadius(1392700)).toBe(696.35);
    expect(bodyRadius(214550)).toBe(107.275);
  });
  it('preserves Earth and Moon orbital distances', () => {
    expect(celestialObjects.find(b => b.id === 'earth')?.orbitRadius).toBe(149597870.7);
    expect(celestialObjects.find(b => b.id === 'moon')?.orbitRadius).toBe(384400);
  });
  it('keeps every body close-up outside its physical surface at desktop and 390 px', () => {
    for (const stop of tourStops.filter(s => !s.lookAt)) {
      const body = celestialObjects.find(b => b.id === stop.locationId);
      if (!body || !['planet', 'moon', 'dwarf-planet', 'star'].includes(body.type)) continue;
      for (const aspect of [1280 / 1800, 390 / 844]) {
        const distance = Math.hypot(...stop.cameraPosition) * 0.001 * portraitFramingFactor(aspect) * (body.category === 'solarSystem' && body.id !== 'sun' ? Math.hypot(0.8, 0.4) : 1);
        expect(distance).toBeGreaterThan(bodyClearance(body.size));
      }
    }
  });
  it('keeps selection framing outside every body', () => {
    for (const body of celestialObjects.filter(b => ['planet', 'moon', 'dwarf-planet', 'star'].includes(b.type))) {
      expect(bodyFlyToDistance(body.size)).toBeGreaterThan(bodyClearance(body.size));
    }
  });
  it('removes exaggerated scale but retains size comparison', () => {
    expect('useExaggeratedScale' in useCosmosStore.getState()).toBe(false);
    const before = useCosmosStore.getState().showSizeComparison;
    useCosmosStore.getState().toggleSizeComparison();
    expect(useCosmosStore.getState().showSizeComparison).toBe(!before);
  });
  it('does not clip close-up Proxima at stellar coordinates', () => {
    expect(closeViewNear(8e10, 500)).toBe(0.5);
    expect(closeViewNear(149597.8707, 30)).toBeCloseTo(0.01495978707);
  });
});