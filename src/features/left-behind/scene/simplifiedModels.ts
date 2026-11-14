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

export function buildLunarRover(): THREE.Group {
  const g = new THREE.Group(), al = metal(), tyre = dark();
  const L = 3.1, WB = 2.3, TRACK = 1.83, WHEEL_R = 0.409, WHEEL_W = 0.23, CLEAR = 0.36, H = 1.14;
  // Chassis (ground clearance to deck) and floor panels
  g.add(mesh(new THREE.BoxGeometry(L, 0.08, 1.1), al, 0, CLEAR + 0.04, 0));
  // Wheels: wire-mesh tyres with chevron band look, hubs
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 24), tyre, sx * WB / 2, WHEEL_R, sz * TRACK / 2);
    w.rotation.x = Math.PI / 2; g.add(w);
    const hub = mesh(new THREE.CylinderGeometry(0.12, 0.12, WHEEL_W + 0.02, 12), al, sx * WB / 2, WHEEL_R, sz * TRACK / 2);
    hub.rotation.x = Math.PI / 2; g.add(hub);
    // Fender above each wheel
    const f = mesh(new THREE.CylinderGeometry(WHEEL_R + 0.06, WHEEL_R + 0.06, WHEEL_W + 0.06, 16, 1, true, Math.PI * 0.15, Math.PI * 0.7), al, sx * WB / 2, WHEEL_R, sz * TRACK / 2);
    f.rotation.set(Math.PI / 2, 0, Math.PI / 2 * 0); f.rotateY(-Math.PI / 2); g.add(f);
    // Suspension arm to the chassis
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.06, TRACK / 2 - 0.5), al, sx * WB / 2, CLEAR + 0.02, sz * (TRACK / 4 + 0.25)));
  }
  // Two side-by-side seats (centre section)
  for (const sz of [-0.3, 0.3]) {
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), al, -0.15, CLEAR + 0.35, sz));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.45, 0.45), al, -0.4, CLEAR + 0.58, sz));
  }
  // Hand controller and console between the seats
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), dark(), 0.15, CLEAR + 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.15, 0.35, 0.4), al, 0.55, CLEAR + 0.3, 0));
  // Front-centre mast with mesh dish antenna; top of the dish at the max height
  const mastTop = H - 0.22;
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, mastTop - CLEAR, 8), al, 1.25, (mastTop + CLEAR) / 2, 0));
  const dish = mesh(new THREE.SphereGeometry(0.5, 20, 8, 0, Math.PI * 2, 0, 0.5), new THREE.MeshStandardMaterial({ color: 0xd0d3d8, metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide, wireframe: false }), 1.25, mastTop - 0.02, 0);
  dish.rotation.z = -0.6; g.add(dish);
  // Rear pallet (tools/samples)
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.9), dark(), -1.25, CLEAR + 0.23, 0));
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
