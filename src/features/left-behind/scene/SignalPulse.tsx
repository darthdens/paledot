// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSignal } from '../state/useSignal';
import { LIGHT_KM_S } from '../lib/signal';
import { eclipticKmToScene } from '../lib/units';
/** Screen-size point only; its position advances at physical light speed on real UTC time. */
export function SignalPulse() {
  const race = useSignal(s => s.race), target = useSignal(s => s.targetId);
  const [reduced, setReduced] = useState(true);
  const point = useRef<THREE.Points>(null);
  const color = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches); update(); query.addEventListener('change', update);
    const skin = document.querySelector('.paledot');
    if (skin) color.set(`hsl(${getComputedStyle(skin).getPropertyValue('--primary').trim()})`);
    return () => query.removeEventListener('change', update);
  }, [color]);
  useFrame(() => {
    const node = point.current, row = race?.rows.find(r => r.id === target);
    if (!node) return;
    node.visible = !!race && !!row && !reduced;
    if (!race || !row || reduced) return;
    const km = Math.max(0, Date.now() - race.sentAt) / 1000 * LIGHT_KM_S;
    node.visible = km < row.distanceKm;
    const position = race.earthKm.map((v, i) => v + (row.direction[i] ?? 0) * Math.min(km, row.distanceKm));
    node.position.set(...eclipticKmToScene(position[0] ?? 0, position[1] ?? 0, position[2] ?? 0));
  });
  return <points ref={point} name="signal-pulse" frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([0,0,0]), 3]} /></bufferGeometry><pointsMaterial color={color} size={4} sizeAttenuation={false} depthWrite={false} /></points>;
}
