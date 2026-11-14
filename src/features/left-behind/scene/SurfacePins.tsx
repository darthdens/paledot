// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { celestialObjects } from '@/components/cosmos/data/celestialObjects';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { getHardware } from '../data/dataClient';
import { eclipticKmToScene } from '../lib/units';
import { loadTrajectory, sampleTrajectory } from '../engine/trajectory';
import { latLonToLocal, TEXTURE_LON_OFFSET_DEG } from '../lib/geo';
import { followHardware } from '../lib/hardwareNavigation';
import { machineCopy } from '../lib/machineCopy';
import { landedPins } from '../lib/pinRegistry';
import { useSurfaceAttachmentStore } from '../state/surfaceAttachments';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';

type Body = 'moon' | 'mars';
type PinSpec = { trajId: string; body: Body; lat: number; lon: number; date: number; label: string };
const LEADER = 0.03; // leader line length as a fraction of the body radius
const CROWD_PX = 24;
const crowded: Record<Body, boolean> = { moon: false, mars: false };
const noRaycast = () => null;

/** Hollow ring on a short leader line, inside the body's spinning mesh so it stays on its spot. */
function SurfacePin({ spec }: { spec: PinSpec }) {
  const group = useRef<THREE.Group>(null), top = useRef<THREE.Group>(null), ring = useRef<HTMLDivElement>(null);
  const shown = useRef<boolean | null>(null);
  const selected = useLeftBehindStore(s => s.selectedHardwareId === spec.trajId);
  const { language } = useLanguage();
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ transparent: true, opacity: .6, depthWrite: false }));
    l.raycast = noRaycast; return l;
  }, []);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); landedPins.delete(spec.trajId); }, [line, spec.trajId]);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);
  useFrame(() => {
    const node = group.current, mesh = node?.parent?.parent?.parent as THREE.Mesh | undefined;
    if (!node || !mesh || !top.current) return;
    const radius = (mesh.geometry as THREE.SphereGeometry | undefined)?.parameters?.radius ?? 1;
    const visible = useSimClock.getState().simDate >= spec.date;
    node.visible = visible;
    if (shown.current === false && visible && ring.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // 2-second touchdown pulse (restarted by re-adding the class).
      ring.current.classList.remove('pd-pin-pulse'); void ring.current.offsetWidth; ring.current.classList.add('pd-pin-pulse');
    }
    shown.current = visible;
    if (ring.current) ring.current.hidden = !visible || crowded[spec.body] || !['earth', 'solarSystem'].includes(useCosmosStore.getState().currentScale);
    if (!visible) { landedPins.delete(spec.trajId); return; }
    const p = latLonToLocal(spec.lat, spec.lon, radius, TEXTURE_LON_OFFSET_DEG[spec.body] ?? 0);
    const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.setXYZ(0, p[0], p[1], p[2]); attr.setXYZ(1, p[0] * (1 + LEADER), p[1] * (1 + LEADER), p[2] * (1 + LEADER)); attr.needsUpdate = true;
    top.current.position.set(p[0] * (1 + LEADER), p[1] * (1 + LEADER), p[2] * (1 + LEADER));
    node.updateWorldMatrix(true, false);
    const world = tmp.a.set(...p).applyMatrix4(node.matrixWorld), centre = tmp.b.setFromMatrixPosition(node.matrixWorld);
    const normal = tmp.c.subVectors(world, centre).normalize();
    landedPins.set(spec.trajId, { world: [world.x, world.y, world.z], body: spec.body, normal: [normal.x, normal.y, normal.z] });
  }, -0.3);
  return <group ref={group} name={`pin-${spec.trajId}`} visible={false}>
    <primitive object={line} />
    <group ref={top}>
      <Html center zIndexRange={[40, 30]}>
        <div ref={ring} hidden className="paledot dark pd-pin-anchor">
          <Button variant="ghost" className="pd-hardware-hit" aria-label={`${machineCopy[language].select} ${spec.label}`} aria-pressed={selected} onClick={() => followHardware(spec.trajId)}>
            <span className={`pd-pin-ring ${selected ? 'pd-hardware-selected' : ''}`} />
          </Button>
        </div>
      </Html>
    </group>
  </group>;
}

/** Faint "Simplified final descent" arc from the last data point to the pin's live world position. */
function DescentArc({ trajId }: { trajId: string }) {
  const [end, setEnd] = useState<[number, number, number] | null>(null);
  const label = useRef<THREE.Group>(null), labelEl = useRef<HTMLSpanElement>(null);
  const selected = useLeftBehindStore(s => s.selectedHardwareId === trajId);
  const { language } = useLanguage();
  useEffect(() => { let live = true; void loadTrajectory(trajId).then(d => { const last = sampleTrajectory(d).at(-1); if (live && last) setEnd(eclipticKmToScene(...last.km)); }).catch(() => {}); return () => { live = false; }; }, [trajId]);
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48 * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ transparent: true, opacity: .25, depthWrite: false, depthTest: false }));
    l.frustumCulled = false; l.visible = false; l.raycast = noRaycast; return l;
  }, []);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); }, [line]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const pin = landedPins.get(trajId);
    line.visible = !!pin && !!end && useCosmosStore.getState().showTrails;
    if (labelEl.current) labelEl.current.hidden = !line.visible || !selected;
    if (!pin || !end) return;
    // Rebased on the pin so the metre-scale end stays steady.
    const [px, py, pz] = pin.world, [nx, ny, nz] = pin.normal;
    const ax = end[0] - px, ay = end[1] - py, az = end[2] - pz, len = Math.hypot(ax, ay, az);
    const cx = ax / 2 + nx * len * .3, cy = ay / 2 + ny * len * .3, cz = az / 2 + nz * len * .3;
    const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < 48; i++) { const t = i / 47, u = 1 - t; attr.setXYZ(i, u * u * ax + 2 * u * t * cx, u * u * ay + 2 * u * t * cy, u * u * az + 2 * u * t * cz); }
    attr.needsUpdate = true;
    const parent = line.parent; tmp.set(px, py, pz); if (parent) parent.worldToLocal(tmp); line.position.copy(tmp);
    label.current?.position.set(tmp.x + ax * .25 + cx * .5, tmp.y + ay * .25 + cy * .5, tmp.z + az * .25 + cz * .5);
  });
  return <>
    <primitive object={line} />
    <group ref={label}><Html center zIndexRange={[30, 20]}><span ref={labelEl} hidden className="paledot dark pd-descent-label">{machineCopy[language].descent}</span></Html></group>
  </>;
}

/** One chip per body when its pins overlap on screen; tapping flies to the body so they fan out. */
function CrowdChip({ body }: { body: Body }) {
  const group = useRef<THREE.Group>(null), el = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const { language } = useLanguage(); const copy = machineCopy[language];
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), list: [] as THREE.Vector2[] }), []);
  useFrame(({ camera, size }) => {
    const pins = [...landedPins.values()].filter(p => p.body === body);
    const scale = useCosmosStore.getState().currentScale;
    if (scale !== 'earth' && scale !== 'solarSystem') { crowded[body] = false; if (el.current) el.current.hidden = true; return; }
    let close = false; tmp.list.length = 0;
    for (const p of pins) { tmp.v.set(...p.world).project(camera); tmp.list.push(new THREE.Vector2((tmp.v.x + 1) * size.width / 2, (1 - tmp.v.y) * size.height / 2)); }
    for (let i = 0; i < tmp.list.length && !close; i++) for (let j = i + 1; j < tmp.list.length; j++) if (tmp.list[i]!.distanceTo(tmp.list[j]!) < CROWD_PX) { close = true; break; }
    crowded[body] = close;
    if (pins.length !== count) setCount(pins.length);
    if (el.current) el.current.hidden = !close;
    if (close && group.current) {
      tmp.v.set(0, 0, 0); for (const p of pins) tmp.v.add({ x: p.world[0], y: p.world[1], z: p.world[2] } as THREE.Vector3);
      tmp.v.divideScalar(pins.length); group.current.parent?.worldToLocal(tmp.v); group.current.position.copy(tmp.v);
    }
  }, -0.2);
  const text = (body === 'moon' ? copy.sites : copy.machinesCount).replace('{n}', String(count));
  return <group ref={group}><Html center zIndexRange={[40, 30]}>
    <div ref={el} hidden className="paledot dark pd-pin-chip-anchor">
      <button type="button" className="pd-pin-chip" onClick={() => { const target = celestialObjects.find(o => o.id === body); useLeftBehindStore.getState().selectHardware(null); if (target) useCosmosStore.getState().setSelectedObject(target); }}><span className="pd-pin-chip-dot" aria-hidden />{text}</button>
    </div>
  </Html></group>;
}

export function SurfacePins() {
  const [arcs, setArcs] = useState<string[]>([]);
  useEffect(() => {
    let live = true; const keys: [string, string][] = [];
    void getHardware().then(h => {
      if (!live) return;
      const ids: string[] = [];
      for (const m of h.machines) {
        if (m.body !== 'moon' && m.body !== 'mars') continue;
        m.trajectories.forEach((t, i) => {
          const site = m.sites?.[i];
          if (!site || site.lat === null || site.lon === null) return;
          const date = Date.parse(site.date ?? m.landingDate ?? '');
          if (!Number.isFinite(date)) return;
          const spec: PinSpec = { trajId: t.id, body: m.body as Body, lat: site.lat, lon: site.lon, date, label: site.label };
          useSurfaceAttachmentStore.getState().set(spec.body, `pin:${t.id}`, <SurfacePin spec={spec} />);
          keys.push([spec.body, `pin:${t.id}`]); ids.push(t.id);
        });
      }
      setArcs(ids);
    }).catch(() => console.warn('TODO(source): hardware unavailable'));
    return () => { live = false; for (const [b, k] of keys) useSurfaceAttachmentStore.getState().set(b, k, null); };
  }, []);
  return <group name="surface-pins">{arcs.map(id => <DescentArc key={id} trajId={id} />)}<CrowdChip body="moon" /><CrowdChip body="mars" /></group>;
}
