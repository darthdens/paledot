// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import hardware from '../../../../public/left-behind/hardware.json';
import { buildPhotos, buildTrajectory } from './nasa';
import type { Machine, Photo, Trajectory } from './types';

const machines: Machine[] = hardware.machines;
const ids = machines.flatMap(machine => machine.trajectories.map(trajectory => trajectory.id));
type RequestData = { action: 'trajectory' | 'photos'; id?: string; rebuild?: boolean };

export const leftBehindData = createServerFn({ method: 'POST' })
  .inputValidator((input: RequestData) => {
    if (!input || !['trajectory', 'photos'].includes(input.action)) throw new Error('Invalid action');
    if (input.action === 'trajectory' && (!input.id || !ids.includes(input.id))) throw new Error('Invalid trajectory');
    return { action: input.action, id: input.id, rebuild: input.rebuild === true };
  })
  .handler(async ({ data }): Promise<Trajectory | Photo[]> => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
    if (!url || !key) throw new Error('Storage connection unavailable');
    // URL parameters never authorize a rebuild. Verify the existing role as the caller.
    if (data.rebuild) {
      const authorization = getRequestHeader('authorization');
      if (!authorization?.startsWith('Bearer ')) throw new Error('Administrator sign-in required');
      const token = authorization.slice(7);
      const caller = createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: authorization }, fetch: (input, init) => {
        const headers = new Headers(init?.headers); headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      } } });
      const { data: user, error } = await caller.auth.getUser(token);
      if (error || !user.user) throw new Error('Administrator sign-in required');
      const { data: admin, error: roleError } = await caller.rpc('has_role', { _user_id: user.user.id, _role: 'admin' });
      if (roleError || admin !== true) throw new Error('Administrator access required');
    }
    const path = data.action === 'photos' ? 'photos/manifest.json' : `trajectories/${data.id}.json`;
    const read = await fetch(`${url}/storage/v1/object/public/left-behind/${path}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!data.rebuild && read.ok) return read.json();
    // Check the bucket before making costly NASA requests. Only trusted, allowlisted data is written.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket('left-behind');
    if (bucketError || !bucket?.public) throw new Error('Public Left Behind storage must be enabled before building data');
    if (!data.rebuild && read.status !== 400 && read.status !== 404) throw new Error('Storage read failed');
    const machine = machines.find(machine => machine.trajectories.some(trajectory => trajectory.id === data.id));
    const settings = machine?.trajectories.find(trajectory => trajectory.id === data.id);
    const result = data.action === 'photos' ? await buildPhotos(machines) : machine && settings ? await buildTrajectory(settings, machine) : null;
    if (!result) throw new Error('Unknown trajectory');
    const { error } = await supabaseAdmin.storage.from('left-behind').upload(path, JSON.stringify(result), { contentType: 'application/json', upsert: data.rebuild, cacheControl: '3600' });
    if (error) throw new Error('Unable to save Left Behind data');
    return result;
  });