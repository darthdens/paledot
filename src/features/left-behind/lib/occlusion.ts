// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';

/** Opaque spheres (planets, moons, Sun) that hide screen-space markers behind them; rescanned every 30 frames. */
type Occluder = { mesh: THREE.Mesh; radius: number };
let occluders: Occluder[] = [];
let lastScan = -Infinity, frame = 0;
const c = new THREE.Vector3(), s = new THREE.Vector3(), d = new THREE.Vector3(), o = new THREE.Vector3();

export function refreshOccluders(scene: THREE.Object3D) {
  frame++;
  if (frame - lastScan < 30) return;
  lastScan = frame;
  const list: Occluder[] = [];
  scene.traverseVisible(obj => {
    const m = obj as THREE.Mesh;
    const g = m.geometry as THREE.SphereGeometry | undefined;
    if (!m.isMesh || g?.type !== 'SphereGeometry') return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (mats.some(mat => mat.transparent || mat.side === THREE.BackSide || mat.depthWrite === false || !mat.visible)) return;
    list.push({ mesh: m, radius: g.parameters.radius });
  });
  occluders = list;
}

/** True when an opaque sphere sits between the camera and the point (point on the surface counts as hidden only on the far side). */
export function isOccluded(camera: THREE.Vector3, point: THREE.Vector3): boolean {
  d.subVectors(point, camera); const len = d.length(); if (len === 0) return false; d.divideScalar(len);
  for (const { mesh, radius } of occluders) {
    if (!mesh.visible) continue;
    mesh.getWorldPosition(c); mesh.getWorldScale(s);
    const r = radius * Math.max(s.x, s.y, s.z) * 0.995;
    const t = o.subVectors(c, camera).dot(d);
    if (t <= 0 || t - r >= len) continue;
    const closest = o.subVectors(c, camera).addScaledVector(d, -t).length();
    if (closest < r && t - Math.sqrt(r * r - closest * closest) < len) return true;
  }
  return false;
}
