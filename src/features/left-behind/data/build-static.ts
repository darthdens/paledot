// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
// Sandbox-only builder. Never import this module into the app.
import { mkdir, writeFile } from 'node:fs/promises';
import hardware from '../../../../public/left-behind/hardware.json';
import { buildPhotos, buildTrajectory } from './nasa';
import type { Machine } from './types';

const machines: Machine[] = hardware.machines;
await mkdir('public/left-behind/trajectories', { recursive: true });
await mkdir('public/left-behind/photos', { recursive: true });
await Promise.all(machines.flatMap(machine => machine.trajectories.map(async settings => {
  const data = await buildTrajectory(settings, machine);
  const json = JSON.stringify(data);
  if (new TextEncoder().encode(json).length > 1048576) throw new Error(`${settings.id} exceeds 1 MB`);
  await writeFile(`public/left-behind/trajectories/${settings.id}.json`, json);
  console.log(settings.id, data.source, data.target ?? '—', data.segments?.reduce((sum, s) => sum + s.positions.length, 0) ?? 0);
})));
const photos = await buildPhotos(machines);
await writeFile('public/left-behind/photos/manifest.json', JSON.stringify(photos, null, 2));
for (const photo of photos) console.log(photo.machineId, photo.nasaId, photo.title, photo.credit, photo.todo ? 'TODO(source)' : '');