import * as THREE from 'three';

/**
 * Level of Detail (LOD) system for galaxy rendering.
 * Reduces particle counts and geometry complexity based on camera distance.
 */

export type LODLevel = 'high' | 'medium' | 'low' | 'sprite';

export interface LODConfig {
  /** Galaxy's visual diameter in scene units */
  galaxyDiameter: number;
  /** Multiplier for HIGH detail threshold (default: 3x diameter) */
  highThresholdMultiplier?: number;
  /** Multiplier for MEDIUM detail threshold (default: 15x diameter) */
  mediumThresholdMultiplier?: number;
  /** Multiplier for LOW detail threshold (default: 50x diameter) */
  lowThresholdMultiplier?: number;
}

/**
 * Calculate LOD level based on camera distance to galaxy center
 */
export const calculateLODLevel = (
  cameraPosition: THREE.Vector3,
  galaxyPosition: THREE.Vector3,
  config: LODConfig
): LODLevel => {
  const distance = cameraPosition.distanceTo(galaxyPosition);
  const diameter = config.galaxyDiameter;

  const highThreshold = diameter * (config.highThresholdMultiplier ?? 3);
  const mediumThreshold = diameter * (config.mediumThresholdMultiplier ?? 15);
  const lowThreshold = diameter * (config.lowThresholdMultiplier ?? 50);

  if (distance < highThreshold) return 'high';
  if (distance < mediumThreshold) return 'medium';
  if (distance < lowThreshold) return 'low';
  return 'sprite';
};

/**
 * Get particle count multiplier for each LOD level
 */
export const getParticleMultiplier = (level: LODLevel): number => {
  switch (level) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.3;
    case 'low':
      return 0.08;
    case 'sprite':
      return 0; // No particles, use sprite only
  }
};

/**
 * Get particle size multiplier for each LOD level
 * Larger particles when fewer are rendered to maintain visual density
 */
export const getParticleSizeMultiplier = (level: LODLevel): number => {
  switch (level) {
    case 'high':
      return 1.0;
    case 'medium':
      return 1.4;
    case 'low':
      return 2.0;
    case 'sprite':
      return 0;
  }
};

/**
 * Check if useFrame updates should be throttled
 * Returns the number of frames to skip (0 = no throttle)
 */
export const getFrameThrottle = (level: LODLevel): number => {
  switch (level) {
    case 'high':
      return 0; // Update every frame
    case 'medium':
      return 2; // Update every 3rd frame
    case 'low':
      return 5; // Update every 6th frame
    case 'sprite':
      return 10; // Update every 11th frame
  }
};

/**
 * Helper to reduce geometry by sampling
 * Returns indices of particles to keep
 */
export const sampleGeometryIndices = (
  totalCount: number,
  multiplier: number,
  seed: number = 12345
): number[] => {
  if (multiplier >= 1) {
    return Array.from({ length: totalCount }, (_, i) => i);
  }

  const targetCount = Math.floor(totalCount * multiplier);
  const indices: number[] = [];

  // Use seeded random for consistent sampling
  let rng = seed;
  const random = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  // Reservoir sampling for uniform distribution
  for (let i = 0; i < totalCount && indices.length < targetCount; i++) {
    const prob = (targetCount - indices.length) / (totalCount - i);
    if (random() < prob) {
      indices.push(i);
    }
  }

  return indices;
};

/**
 * Create a reduced geometry from a full geometry based on LOD level
 */
export const createLODGeometry = (
  fullGeometry: THREE.BufferGeometry,
  level: LODLevel
): THREE.BufferGeometry => {
  const multiplier = getParticleMultiplier(level);

  if (multiplier >= 1) {
    return fullGeometry;
  }

  if (multiplier === 0) {
    // Return empty geometry for sprite mode
    return new THREE.BufferGeometry();
  }

  const positions = fullGeometry.getAttribute('position');
  const colors = fullGeometry.getAttribute('color');
  const totalCount = positions.count;
  const indices = sampleGeometryIndices(totalCount, multiplier);
  const newCount = indices.length;

  const newPositions = new Float32Array(newCount * 3);
  const newColors = new Float32Array(newCount * 3);

  for (let i = 0; i < newCount; i++) {
    const srcIdx = indices[i]! * 3;
    const dstIdx = i * 3;

    newPositions[dstIdx] = positions.array[srcIdx];
    newPositions[dstIdx + 1] = positions.array[srcIdx + 1];
    newPositions[dstIdx + 2] = positions.array[srcIdx + 2];

    newColors[dstIdx] = colors.array[srcIdx];
    newColors[dstIdx + 1] = colors.array[srcIdx + 1];
    newColors[dstIdx + 2] = colors.array[srcIdx + 2];
  }

  const reducedGeo = new THREE.BufferGeometry();
  reducedGeo.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
  reducedGeo.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
  reducedGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);

  return reducedGeo;
};

/**
 * Hook-like utility to manage LOD state with hysteresis
 * Prevents rapid switching between LOD levels
 */
export class LODController {
  private currentLevel: LODLevel = 'high';
  private frameCount = 0;
  private stableFrames = 0;
  private readonly hysteresisFrames = 30; // Require 30 stable frames before switching

  constructor(initialLevel: LODLevel = 'high') {
    this.currentLevel = initialLevel;
  }

  update(
    cameraPosition: THREE.Vector3,
    galaxyPosition: THREE.Vector3,
    config: LODConfig
  ): { level: LODLevel; changed: boolean } {
    this.frameCount++;

    const distance = cameraPosition.distanceTo(galaxyPosition);
    const diameter = config.galaxyDiameter;
    const highThreshold = diameter * (config.highThresholdMultiplier ?? 3);
    const mediumThreshold = diameter * (config.mediumThresholdMultiplier ?? 15);
    const lowThreshold = diameter * (config.lowThresholdMultiplier ?? 50);

    const newLevel = calculateLODLevel(cameraPosition, galaxyPosition, config);

    if (newLevel === this.currentLevel) {
      this.stableFrames = 0;
      return { level: this.currentLevel, changed: false };
    }

    // If we rapidly moved closer (quick jump), upgrade LOD immediately so the core/arms
    // don't stay stuck in a low-density LOD until some unrelated re-render happens.
    const levelRank: Record<LODLevel, number> = {
      high: 3,
      medium: 2,
      low: 1,
      sprite: 0,
    };
    const isUpgrade = levelRank[newLevel] > levelRank[this.currentLevel];

    const isDeepInsideThreshold =
      (newLevel === 'high' && distance < highThreshold * 0.6) ||
      (newLevel === 'medium' && distance < mediumThreshold * 0.6) ||
      (newLevel === 'low' && distance < lowThreshold * 0.6);

    if (isUpgrade && isDeepInsideThreshold) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      this.stableFrames = 0;
      return { level: this.currentLevel, changed: oldLevel !== newLevel };
    }

    this.stableFrames++;

    if (this.stableFrames >= this.hysteresisFrames) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      this.stableFrames = 0;
      return { level: this.currentLevel, changed: oldLevel !== newLevel };
    }

    return { level: this.currentLevel, changed: false };
  }

  shouldUpdateThisFrame(): boolean {
    const throttle = getFrameThrottle(this.currentLevel);
    return this.frameCount % (throttle + 1) === 0;
  }

  getLevel(): LODLevel {
    return this.currentLevel;
  }
}
