// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';

/**
 * Simplified stand-ins for hardware with no NASA 3D model, built in metres (+Y up) from published dimensions.
 * Lunar Roving Vehicle — NSSDCA (https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html): frame 3.1 m long,
 * wheelbase 2.3 m, max height 1.14 m, ground clearance 36 cm, wheels 81.8 cm × 23 cm, mesh dish antenna on a front mast.
 * Track 1.83 m to wheel centres — Boeing LRV press kit (http://www.ninfinger.org/karld/LRV%20Documents/A17_LunarRover2.pdf).
 * Laser reflector — NASA JPL: 100 corner cubes in a 46 cm square aluminium panel
 * (https://www.jpl.nasa.gov/news/apollo-11-experiment-continues-to-return-valuable-data/).
 * Seat, fender, dish and pallet shapes are simplified; they are labelled "Simplified model" in the app.
 */
const metal = () => new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.6, roughness: 0.45 });
const dark = () => new THREE.MeshStandardMaterial({ color: 0x3a3c42, metalness: 0.3, roughness: 0.8 });
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };

/** Woven wire-mesh look (zinc-coated piano wire tyres, umbrella-antenna mesh) as an alpha-tested canvas texture. */
let meshTex: THREE.Texture | null = null;
function wireMeshTexture() {
  if (meshTex) return meshTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!; x.strokeStyle = '#d8dbe0'; x.lineWidth = 3;
  for (let i = -64; i <= 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke(); x.beginPath(); x.moveTo(i, 64); x.lineTo(i + 64, 0); x.stroke(); }
  meshTex = new THREE.CanvasTexture(c); meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.colorSpace = THREE.SRGBColorSpace;
  return meshTex;
}
const tube = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
  const d = new THREE.Vector3().subVectors(b, a), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m);
  o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function buildLunarRover(): THREE.Group {
  const g = new THREE.Group();
  const al = metal(), tyre = dark();
  const alBright = new THREE.MeshStandardMaterial({ color: 0xd6d9de, metalness: 0.85, roughness: 0.3 });
  const white = new THREE.MeshStandardMaterial({ color: 0xeceae4, metalness: 0, roughness: 0.85 }); // thermal blankets / dust covers
  const fender = new THREE.MeshStandardMaterial({ color: 0x9a9890, metalness: 0.1, roughness: 0.7, side: THREE.DoubleSide });
  const webbing = new THREE.MeshStandardMaterial({ color: 0x8f9aa6, metalness: 0, roughness: 0.95, side: THREE.DoubleSide }); // nylon seat webbing
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.9, roughness: 0.35 });
  const wire = new THREE.MeshStandardMaterial({ map: wireMeshTexture(), alphaTest: 0.4, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide });
  void tyre;
  const L = 3.1, WB = 2.3, TRACK = 1.83, WHEEL_R = 0.409, WHEEL_W = 0.23, CLEAR = 0.36, H = 1.14;
  const deck = CLEAR + 0.04;

  // Open aluminium-tube chassis (forward, centre, aft sections) with beaded floor panels in the centre
  for (const z of [-0.55, 0.55]) g.add(tube(V(-L / 2, deck, z), V(L / 2, deck, z), 0.025, al));
  for (const x of [-L / 2, -0.75, 0.75, L / 2]) g.add(tube(V(x, deck, -0.55), V(x, deck, 0.55), 0.022, al));
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.015, 1.08), alBright, 0, deck - 0.01, 0));

  // Wheels: wire-mesh tyres with titanium chevron treads, spun-aluminium hubs, fibreglass fenders
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(sx * WB / 2, WHEEL_R, sz * TRACK / 2);
    const tread = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 40, 1, true), wire);
    (tread.material as THREE.MeshStandardMaterial).map!.repeat.set(10, 1.5); tread.rotation.x = Math.PI / 2; w.add(tread);
    for (let i = 0; i < 18; i++) { // chevrons: two halves angled into a V
      const a = (i / 18) * Math.PI * 2;
      for (const side of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, WHEEL_W * 0.5), alBright);
        c.position.set(Math.cos(a) * (WHEEL_R + 0.004), Math.sin(a) * (WHEEL_R + 0.004), side * WHEEL_W * 0.24);
        c.rotation.z = a + Math.PI / 2; c.rotateY(side * 0.45); w.add(c);
      }
    }
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R * 0.78, WHEEL_R * 0.78, WHEEL_W * 0.7, 24, 1, true), wire);
    inner.rotation.x = Math.PI / 2; w.add(inner);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, WHEEL_W + 0.03, 20), al); hub.rotation.x = Math.PI / 2; w.add(hub);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.add(tube(V(0, 0, sz * 0.1), V(Math.cos(a) * WHEEL_R * 0.78, Math.sin(a) * WHEEL_R * 0.78, sz * 0.1), 0.008, alBright)); }
    g.add(w);
    // Fender over the top of the wheel (theta = π points up after the X rotation)
    const f = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R + 0.07, WHEEL_R + 0.07, WHEEL_W + 0.1, 24, 1, true, Math.PI * 0.58, Math.PI * 0.84), fender);
    f.position.copy(w.position); f.rotation.x = Math.PI / 2; g.add(f);
    // Double-wishbone suspension arms and torsion bar to the chassis
    for (const dy of [-0.05, 0.08]) g.add(tube(V(sx * WB / 2, WHEEL_R + dy * 0.3, sz * (TRACK / 2 - WHEEL_W / 2)), V(sx * (WB / 2 - 0.25), deck + dy, sz * 0.55), 0.018, al));
  }

  // Two seats: tube frames with nylon webbing, armrests and footrests
  for (const sz of [-0.3, 0.3]) {
    const s0 = V(-0.45, deck + 0.28, sz);
    g.add(mesh(new THREE.BoxGeometry(0.46, 0.01, 0.44), webbing, s0.x + 0.05, s0.y, sz));
    const back = mesh(new THREE.BoxGeometry(0.01, 0.42, 0.44), webbing, s0.x - 0.2, s0.y + 0.2, sz); back.rotation.z = 0.15; g.add(back);
    for (const ez of [-0.22, 0.22]) {
      g.add(tube(V(s0.x + 0.28, deck, sz + ez), V(s0.x + 0.28, s0.y, sz + ez), 0.012, al));
      g.add(tube(V(s0.x - 0.18, deck, sz + ez), V(s0.x - 0.24, s0.y + 0.42, sz + ez), 0.012, al));
      g.add(tube(V(s0.x - 0.2, s0.y + 0.15, sz + ez), V(s0.x + 0.25, s0.y + 0.15, sz + ez), 0.01, al)); // armrest
    }
    g.add(mesh(new THREE.BoxGeometry(0.25, 0.01, 0.36), alBright, 0.45, deck + 0.05, sz)); // footrest
  }
  // T-handle hand controller between the seats, and the angled control/display console with Sun compass
  g.add(tube(V(0.0, deck, 0), V(0.0, deck + 0.42, 0), 0.015, al));
  g.add(tube(V(0.0, deck + 0.42, -0.05), V(0.0, deck + 0.42, 0.05), 0.015, tyre));
  const console_ = new THREE.Group(); console_.position.set(0.55, deck + 0.5, 0); console_.rotation.z = 0.5;
  console_.add(mesh(new THREE.BoxGeometry(0.06, 0.32, 0.42), al));
  console_.add(mesh(new THREE.BoxGeometry(0.01, 0.26, 0.36), tyre, -0.035, 0, 0));
  console_.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6), alBright, -0.03, 0.2, 0));
  g.add(console_);
  g.add(tube(V(0.55, deck, 0), V(0.55, deck + 0.4, 0), 0.02, al));

  // Forward chassis: batteries and electronics under white dust covers
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.18, 0.9), white, 1.15, deck + 0.1, 0));
  // Communications relay unit (front), umbrella-mesh high-gain dish on its mast, helical low-gain antenna, TV camera
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.22, 0.34), white, 1.4, deck + 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.01, 0.34), alBright, 1.4, deck + 0.415, 0)); // radiator mirror
  const mastTop = H - 0.25;
  g.add(tube(V(1.3, deck + 0.42, 0.2), V(1.3, mastTop, 0.2), 0.015, al));
  const dish = new THREE.Group(); dish.position.set(1.3, mastTop, 0.2); dish.rotation.z = -0.9;
  const pts: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const r = i / 10 * 0.46; pts.push(new THREE.Vector2(r, r * r * 0.9)); }
  dish.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 32), wire));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dish.add(tube(V(0, 0, 0), V(Math.cos(a) * 0.46, 0.19, Math.sin(a) * 0.46), 0.004, alBright)); }
  dish.add(tube(V(0, 0, 0), V(0, 0.3, 0), 0.006, alBright));
  g.add(dish);
  const helix: THREE.Vector3[] = []; for (let i = 0; i <= 60; i++) { const a = i * 0.6; helix.push(V(1.3 + Math.cos(a) * 0.025, deck + 0.42 + i * 0.008, -0.25 + Math.sin(a) * 0.025)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 120, 0.003, 4), alBright));
  g.add(tube(V(1.5, deck + 0.42, -0.05), V(1.5, deck + 0.75, -0.05), 0.015, al));
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), white, 1.52, deck + 0.8, -0.05));
  const lens = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 16), gold, 1.66, deck + 0.8, -0.05); lens.rotation.z = Math.PI / 2; g.add(lens);

  // Aft chassis: tool and sample pallet with gnomon, tongs and scoop
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.02, 1.0), al, -1.25, deck + 0.05, 0));
  g.add(mesh(new THREE.BoxGeometry(0.45, 0.32, 0.6), al, -1.25, deck + 0.22, 0));
  for (const z of [-0.4, -0.3, 0.32, 0.42]) g.add(tube(V(-1.4, deck + 0.05, z), V(-1.2, deck + 0.85, z), 0.008, alBright));
  return g;
}

/** 46 cm square panel of 100 corner cubes, tilted on a small pallet. Built in metres, +Y up. */
export function buildRetroreflector(): THREE.Group {
  const g = new THREE.Group(), al = metal();
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), al, 0, 0.04, 0));
  const panel = new THREE.Group(); panel.position.set(0, 0.2, 0); panel.rotation.x = -0.35;
  panel.add(mesh(new THREE.BoxGeometry(0.46, 0.04, 0.46), al));
  const cube = new THREE.CylinderGeometry(0.019, 0.019, 0.01, 8), glass = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, metalness: 0.9, roughness: 0.1 });
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) panel.add(mesh(cube, glass, -0.207 + i * 0.046, 0.025, -0.207 + j * 0.046));
  g.add(panel);
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), al, 0, 0.12, 0.18));
  return g;
}
