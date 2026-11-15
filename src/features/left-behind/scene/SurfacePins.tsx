// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { refreshOccluders, isOccluded } from '../lib/occlusion';
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
import { landedPins, type LandedPin } from '../lib/pinRegistry';
import { useSurfaceAttachmentStore } from '../state/surfaceAttachments';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useSimClock } from '../state/useSimClock';
import { SitePatch } from './SitePatch';
import { groundHeightM, preloadSiteHeights } from '../lib/terrainHeights';
import { METRE, reliefSync } from '@/components/cosmos/lib/relief';
import { buildRetroreflector } from './simplifiedModels';

/** True-size simplified hardware with no pin of its own (e.g. Apollo 11's laser reflector), shown while its site is followed. */
function SiteExtra({ body, lat, lon, radius }: { body: Body; lat: number; lon: number; radius: number }) {
  const object = useMemo(() => {
    const g = buildRetroreflector(); g.scale.setScalar(1e-6); // metres -> scene units (1 unit = 1000 km)
    const p = latLonToLocal(lat, lon, radius, TEXTURE_LON_OFFSET_DEG[body] ?? 0);
    const n = new THREE.Vector3(p.x, p.y, p.z).normalize();
    g.position.set(p.x, p.y, p.z); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    g.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.frustumCulled = false; m.raycast = noRaycast; } });
    return g;
  }, [body, lat, lon, radius]);
  useEffect(() => () => object.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } }), [object]);
  return <primitive object={object} />;
}

type Body = 'moon' | 'mars';
type PinSpec = { trajId: string; body: Body; lat: number; lon: number; date: number; label: string; extras?: { lat: number; lon: number }[] };
const LEADER = 0.03; // leader line length as a fraction of the body radius
const CROWD_PX = 24;
const crowded: Record<Body, boolean> = { moon: false, mars: false };
const noRaycast = () => null;

/** Hollow ring on a short leader line, inside the body's spinning mesh so it stays on its spot. */
function SurfacePin({ spec }: { spec: PinSpec }) {
  const group = useRef<THREE.Group>(null), top = useRef<THREE.Group>(null), ring = useRef<HTMLDivElement>(null);
  const shown = useRef<boolean | null>(null);
  const selected = useLeftBehindStore(s => s.selectedHardwareId === spec.trajId);
  const followed = useLeftBehindStore(s => s.followTargetId === spec.trajId);
  const [patch, setPatch] = useState<{ local: [number, number, number]; radius: number; mesh: THREE.Mesh } | null>(null);
  const { language } = useLanguage();
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ transparent: true, opacity: .6, depthWrite: false }));
    l.raycast = noRaycast; return l;
  }, []);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); landedPins.delete(spec.trajId); }, [line, spec.trajId]);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), inverse: new THREE.Matrix4(), ground: new THREE.Vector3(), radius: 1 }), []);
  const fixedNormal = useMemo(() => new THREE.Vector3(...latLonToLocal(spec.lat, spec.lon, 1, TEXTURE_LON_OFFSET_DEG[spec.body] ?? 0)), [spec]);
  const pin = useMemo<LandedPin>(() => ({ world: [0,0,0], normal: [0,1,0], centre: [0,0,0], body: spec.body, groundAt: (x,y,z) => {
    const v = tmp.ground.set(x,y,z).applyMatrix4(tmp.inverse), r = v.length() || 1;
    const lat = Math.asin(v.y/r)*180/Math.PI, lon = Math.atan2(-v.z,v.x)*180/Math.PI-(TEXTURE_LON_OFFSET_DEG[spec.body] ?? 0);
    return tmp.radius + groundHeightM(spec.body,lat,lon)*METRE;
  } }), [spec, tmp]);
  useFrame(({ camera, scene }) => {
    refreshOccluders(scene);
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
    // Real ground height (site DTM / global map) once the body shows its relief; flat sphere before that.
    if (reliefSync(spec.body)) preloadSiteHeights(spec.body);
    const ground = radius + groundHeightM(spec.body, spec.lat, spec.lon) * METRE;
    const p = tmp.a.copy(fixedNormal).multiplyScalar(ground);
    if (followed && (!patch || patch.radius !== radius || patch.mesh !== mesh)) setPatch({ local: [p.x, p.y, p.z], radius, mesh });
    else if (!followed && patch) setPatch(null);
    const attr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.setXYZ(0, p.x, p.y, p.z); attr.setXYZ(1, p.x * (1 + LEADER), p.y * (1 + LEADER), p.z * (1 + LEADER)); attr.needsUpdate = true;
    top.current.position.set(p.x * (1 + LEADER), p.y * (1 + LEADER), p.z * (1 + LEADER));
    node.updateWorldMatrix(true, false);
    const world = tmp.a.applyMatrix4(node.matrixWorld), centre = tmp.b.setFromMatrixPosition(node.matrixWorld);
    const normal = tmp.c.subVectors(world, centre).normalize();
    tmp.inverse.copy(node.matrixWorld).invert(); tmp.radius = radius;
    pin.world[0]=world.x; pin.world[1]=world.y; pin.world[2]=world.z;
    pin.normal[0]=normal.x; pin.normal[1]=normal.y; pin.normal[2]=normal.z;
    pin.centre[0]=centre.x; pin.centre[1]=centre.y; pin.centre[2]=centre.z;
    landedPins.set(spec.trajId, pin);
    if (ring.current && !ring.current.hidden && isOccluded(camera.position, world)) ring.current.hidden = true;
  }, -0.3);
  return <group ref={group} name={`pin-${spec.trajId}`} visible={false}>
    {patch && <SitePatch body={spec.body} lat={spec.lat} lon={spec.lon} radius={patch.radius} mesh={patch.mesh} />}
    {patch && spec.extras?.map((e, i) => <SiteExtra key={i} body={spec.body} lat={e.lat} lon={e.lon} radius={patch.radius} />)}
    <primitive object={line} visible={!followed} />
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
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ transparent: true, opacity: .25, depthWrite: false }));
    l.frustumCulled = false; l.visible = false; l.raycast = noRaycast; return l;
  }, []);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); }, [line]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const pin = landedPins.get(trajId);
    // Hidden while following this machine: up close the arc slices through the view.
    line.visible = !!pin && !!end && useCosmosStore.getState().showTrails && useLeftBehindStore.getState().followTargetId !== trajId;
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
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), occ: new THREE.Vector3(), list: Array.from({length:7}, () => new THREE.Vector2()), pins: [] as LandedPin[] }), []);
  useFrame(({ camera, size }) => {
    const pins = tmp.pins; pins.length = 0;
    for (const pin of landedPins.values()) if (pin.body === body && !isOccluded(camera.position, tmp.occ.set(...pin.world))) pins.push(pin);
    const scale = useCosmosStore.getState().currentScale;
    if (scale !== 'earth' && scale !== 'solarSystem') { crowded[body] = false; if (el.current) el.current.hidden = true; return; }
    let close = false;
    for (let i=0;i<pins.length;i++) { const pin=pins[i], point=tmp.list[i]; if (!pin || !point) continue; tmp.v.set(...pin.world).project(camera); point.set((tmp.v.x+1)*size.width/2,(1-tmp.v.y)*size.height/2); }
    for (let i=0;i<pins.length&&!close;i++) for(let j=i+1;j<pins.length;j++) { const a=tmp.list[i], b=tmp.list[j]; if(a&&b&&a.distanceTo(b)<CROWD_PX) {close=true;break;} }
    crowded[body] = close;
    if (pins.length !== count) setCount(pins.length);
    if (el.current) el.current.hidden = !close;
    if (close && group.current) {
      tmp.v.set(0, 0, 0); for (const p of pins) tmp.v.add(tmp.occ.set(...p.world));
      tmp.v.divideScalar(pins.length); group.current.parent?.worldToLocal(tmp.v); group.current.position.copy(tmp.v);
    }
  }, -0.2);
  const text = (body === 'moon' ? copy.sites : copy.machinesCount).replace('{n}', String(count));
  return <group ref={group}><Html center zIndexRange={[40, 30]}>
    <div ref={el} hidden className="paledot dark pd-pin-chip-anchor">
      <Button variant="ghost" type="button" className="pd-pin-chip" onClick={() => { const target = celestialObjects.find(o => o.id === body); useLeftBehindStore.getState().selectHardware(null); if (target) useCosmosStore.getState().setSelectedObject(target); }}><span className="pd-pin-chip-dot" aria-hidden />{text}</Button>
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
          // Apollo 11: the laser reflector is an extra site beyond the trajectories, drawn with this pin.
          if (i === m.trajectories.length - 1) spec.extras = (m.sites ?? []).slice(m.trajectories.length).filter(x => x.lat !== null && x.lon !== null && /retroreflector/i.test(x.label)).map(x => ({ lat: x.lat as number, lon: x.lon as number }));
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
