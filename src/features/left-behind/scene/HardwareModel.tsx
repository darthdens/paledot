// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { loadTrueSpans, trueSpanUnits } from '../lib/nasaModels';
import { landedPins } from '../lib/pinRegistry';

// True-scale NASA model; the HTML ring marker in HardwareTrack keeps it findable from afar.
// (Only that ring is screen-size, per "markers not to scale".)
const MARKER_PX = 40, SELECTED_PX = 76;
const PARENT_RADIUS: Record<string, number> = { moon: 1.7374, mars: 3.3895 };

export function HardwareModel({ id, url, selected, parent }: { id: string; url: string; selected: boolean; parent?: 'moon' | 'mars' | undefined }) {
  const { scene } = useGLTF(url, false);
  const group = useRef<THREE.Group>(null);
  useEffect(() => { void loadTrueSpans(); }, []);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const swap = (m: THREE.Material) => {
        const source = m as THREE.MeshStandardMaterial;
        // Self-lit so the hardware stays readable billions of km from the Sun's point light.
        const material = new THREE.MeshStandardMaterial({ map: source.map ?? null, color: source.color?.clone() ?? new THREE.Color(1, 1, 1), metalness: 0.2, roughness: 0.7 });
        material.emissive = material.color.clone(); material.emissiveMap = source.map ?? null; material.emissiveIntensity = 0.55;
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
      mesh.frustumCulled = false;
    });
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
    const unit = 1 / Math.max(size.x, size.y, size.z, 1e-9);
    const wrapper = new THREE.Group();
    clone.position.copy(center).multiplyScalar(-unit); clone.scale.setScalar(unit);
    wrapper.add(clone);
    wrapper.userData.halfHeight = (size.y * unit) / 2;
    return wrapper;
  }, [scene]);
  useEffect(() => () => model.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose());
  }), [model]);
  const tmp = useMemo(() => ({ world: new THREE.Vector3(), dir: new THREE.Vector3(), parent: new THREE.Vector3(), q: new THREE.Quaternion(), up: new THREE.Vector3(0, 1, 0) }), []);
  useFrame(({ camera, size }, delta) => {
    const node = group.current, holder = node?.parent;
    if (!node || !holder) return;
    holder.getWorldPosition(tmp.world);
    const distance = camera.position.distanceTo(tmp.world);
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 60;
    const worldSize = 2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (selected ? SELECTED_PX : MARKER_PX) / Math.max(size.height, 1);
    // The model is always drawn at its true size (hardware.json trueSize); the ring/pin marker keeps it findable.
    const trueSpan = trueSpanUnits.get(id);
    node.visible = trueSpan !== undefined;
    const scale = trueSpan ?? worldSize;
    node.scale.setScalar(scale);
    node.position.set(0, 0, 0);
    node.quaternion.identity();
    const pin = landedPins.get(id);
    if (pin) {
      // Landed: stand upright on the local ground (model +Y along the surface normal), feet on the surface.
      holder.getWorldQuaternion(tmp.q).invert();
      tmp.dir.set(...pin.normal).applyQuaternion(tmp.q).normalize();
      node.quaternion.setFromUnitVectors(tmp.up, tmp.dir);
      node.position.copy(tmp.dir).multiplyScalar(scale * (model.userData.halfHeight ?? 0.5));
    } else if (parent) {
      const p = useCosmosStore.getState().objectWorldPositions[parent];
      const radius = PARENT_RADIUS[parent] ?? 0;
      if (p) {
        tmp.parent.set(...p);
        tmp.dir.subVectors(tmp.world, tmp.parent);
        // Sit the screen-size marker on the surface instead of half inside the body.
        if (tmp.dir.length() < radius * 1.5) {
          tmp.dir.normalize().multiplyScalar(scale * 0.55).add(tmp.world);
          holder.worldToLocal(tmp.dir); node.position.copy(tmp.dir);
        }
      }
    }
  }, -0.2);
  return <group ref={group} renderOrder={3}><primitive object={model} /></group>;
}
