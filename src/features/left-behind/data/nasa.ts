// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { Machine, Photo, Segment, Trajectory, TrajectorySettings } from './types';

const DAY = 86400000;
export async function getJson(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (response.ok) return response.json();
    if (response.status < 500 || attempt === 2) throw new Error(`NASA request failed (${response.status}): ${url}`);
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw new Error('NASA request unavailable');
}

export function planWindows(settings: TrajectorySettings, machine: Machine) {
  const start = Date.parse(settings.start ?? settings.launch ?? machine.launchDate);
  const stop = Date.parse(settings.stop ?? settings.arrival ?? machine.landingDate ?? '');
  if (!Number.isFinite(start) || !Number.isFinite(stop) || stop <= start) throw new Error('TODO(source): missing flight dates');
  const firstYear = Math.min(stop, Date.parse(settings.launch ?? machine.launchDate) + 365 * DAY);
  const encounters = (settings.encounters ?? []).map(date => Date.parse(date));
  const boundaries = new Set([start, stop]);
  if (firstYear > start && firstYear < stop) boundaries.add(firstYear);
  encounters.forEach(date => { boundaries.add(Math.max(start, date - 10 * DAY)); boundaries.add(Math.min(stop, date + 10 * DAY)); });
  const ordered = [...boundaries].filter(date => date >= start && date <= stop).sort((a, b) => a - b);
  return ordered.slice(0, -1).map((from, index) => {
    const to = ordered[index + 1] ?? stop;
    const midpoint = (from + to) / 2;
    const stepSeconds = encounters.some(date => Math.abs(midpoint - date) <= 10 * DAY) ? 3600 : midpoint < firstYear ? 86400 : 432000;
    return { from, to, stepSeconds, center: 'sun' as const };
  });
}

export function parseVectors(text: string): { start: string; positions: number[][] } {
  const block = text.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!block) throw new Error('Horizons returned no vector table');
  const rows = block.trim().split('\n').filter(row => row.trim()).map(row => row.split(',').map(value => value.trim()));
  const positions = rows.map(row => row.slice(2, 5).map(value => Math.round(Number(value))));
  if (!positions.length || positions.some(position => position.length !== 3 || position.some(value => !Number.isFinite(value)))) throw new Error('Invalid Horizons vector table');
  const julian = Number(rows[0]?.[0]);
  if (!Number.isFinite(julian)) throw new Error('Invalid Horizons epoch');
  return { start: new Date(Math.round((julian - 2440587.5) * DAY)).toISOString(), positions };
}

export async function buildTrajectory(settings: TrajectorySettings, machine: Machine): Promise<Trajectory> {
  let target = settings.horizonsTarget;
  if (!target && settings.lookup) {
    const launch = (settings.launch ?? machine.launchDate).slice(0, 10);
    const arrival = (settings.arrival ?? machine.landingDate ?? settings.stop ?? '').slice(0, 10);
    const searches = settings.id === 'opportunity' ? ['MER-1', 'Opportunity'] : [settings.lookup];
    for (const search of searches) {
      const lookup = await getJson(`https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=${encodeURIComponent(search)}&group=sct`);
      const record = (lookup.result ?? []).find((entry: { spkid?: string; name?: string }) => {
        const dates = entry.name?.match(/\d{4}-\d{2}-\d{2}/g);
        return dates && dates.length >= 2 && (dates[0] ?? '') <= launch && (dates[1] ?? '') >= arrival;
      });
      if (record?.spkid) { target = String(record.spkid); break; }
    }
  }
  if (!target) {
    if (settings.fallback !== 'simplified') throw new Error('TODO(source): no usable Horizons target');
    return { id: settings.id, source: 'simplified', milestones: { launch: settings.launch ?? machine.launchDate, arrival: settings.arrival ?? machine.landingDate, center: settings.center, arrivalBody: settings.arrivalBody ?? null }, note: 'No NASA trajectory data available; path drawn between real launch and arrival positions' };
  }
  const windows: { from: number; to: number; stepSeconds: number; center: 'sun' | 'mars' }[] = planWindows(settings, machine);
  if (settings.arrivalBody === 'mars' && settings.arrival) {
    const to = Date.parse(settings.arrival);
    windows.push({ from: to - 3 * DAY, to, stepSeconds: 3600, center: 'mars' });
  }
  const query: string[] = [];
  const segments: Segment[] = [];
  const gaps: string[] = [];
  for (const window of windows) {
    const formatDate = (date: number) => new Date(date).toISOString().slice(0, 19).replace('T', ' ');
    const params = new URLSearchParams({ format: 'json', COMMAND: `'${target}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'", EPHEM_TYPE: "'VECTORS'", CENTER: window.center === 'mars' ? "'500@499'" : "'500@10'", REF_PLANE: "'ECLIPTIC'", REF_SYSTEM: "'ICRF'", OUT_UNITS: "'KM-S'", VEC_TABLE: "'1'", CSV_FORMAT: "'YES'", TIME_TYPE: "'UT'", START_TIME: `'${formatDate(window.from)}'`, STOP_TIME: `'${formatDate(window.to)}'`, STEP_SIZE: `'${window.stepSeconds / 60} m'` });
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    query.push(url);
    let result = await getJson(url);
    // JPL does not include launch ascent for Mars 2020. Start only at its
    // explicitly reported first epoch and retain the gap, never interpolate it.
    const unavailableBefore = result.error?.match(/prior to A\.D\. (\d{4}-[A-Z]{3}-\d{2} [\d:.]+) UT/i)?.[1];
    if (unavailableBefore && window === windows[0]) {
      const epoch = Date.parse(`${unavailableBefore} UTC`);
      if (Number.isFinite(epoch) && epoch < window.to) {
        gaps.push(`TODO(source): no Horizons positions between ${formatDate(window.from)} UTC and ${unavailableBefore} UTC`);
        params.set('START_TIME', `'${formatDate(Math.ceil(epoch / 1000) * 1000)}'`);
        const clippedUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
        query.push(clippedUrl);
        result = await getJson(clippedUrl);
      }
    }
    if (result.error) throw new Error(`Horizons: ${result.error}`);
    segments.push({ center: window.center, stepSeconds: window.stepSeconds, ...parseVectors(result.result ?? '') });
  }
  return { id: settings.id, source: 'horizons', target, query, retrievedAt: new Date().toISOString(), frame: 'heliocentric ecliptic J2000', units: 'km', segments, ...(gaps.length ? { note: gaps.join('; ') } : {}) };
}

type LibraryItem = { data?: { nasa_id: string; title: string; description?: string; keywords?: string[]; photographer?: string; secondary_creator?: string; center?: string; date_created?: string }[] };
export function acceptablePhoto(item: LibraryItem, machine: Machine, query?: string) {
  const data = item.data?.[0];
  if (!data || /\b(logo|insignia|patch|emblem)\b/i.test([data.title, ...(data.keywords ?? [])].join(' '))) return false;
  if (/\b(simulations?|trainer|model|artists?|concept|illustration|animation|diagram|chart|instruments|magnetic|team|logbook|logs?|montage|3D)\b/i.test(data.title)) return false;
  if (/Voyager [12]/i.test(data.title) && !data.title.includes(machine.name) && machine.id.startsWith('voyager')) return false;
  if (!query) return true;
  if (query === 'Voyager spacecraft') {
    const physical = /encapsulation|testing|flight hardware|preparing for launch|system test|in Florida/i.test(data.title);
    if (!physical || !/spacecraft/i.test(data.description ?? '')) return false;
    if (!new RegExp(machine.name, 'i').test(data.title + ' ' + data.description)) return false;
    return true;
  }
  if (machine.id === 'ingenuity' && query.includes('first flight')) {
    return /Ingenuity.*first flight/i.test(data.title) && /helicopter/i.test(data.description ?? '');
  }
  const name = machine.id === 'lunar-rovers' ? query.match(/Apollo \d+/i)?.[0] ?? 'Apollo' : machine.id.startsWith('voyager') ? 'Voyager' : machine.id.replaceAll('-', ' ');
  if (data.title.toLowerCase().includes(name.toLowerCase())) return true;
  // These searches require the actual hardware, not merely an image it took.
  if (machine.id === 'apollo-11' && query.includes('retroreflector')) {
    return /Apollo 11/i.test(data.description ?? '') && /retroreflector|laser ranging/i.test(data.title + ' ' + data.description);
  }
  if (machine.id === 'ingenuity' && query.includes('first flight')) {
    return /Ingenuity/i.test(data.description ?? '') && /helicopter/i.test(data.title + ' ' + data.description) && /first flight|first.*flight/i.test(data.title + ' ' + data.description);
  }
  return false;
}

export async function buildPhotos(machines: Machine[]): Promise<Photo[]> {
  const manifest: Photo[] = [];
  for (const machine of machines) for (const [index, entry] of machine.photos.entries()) {
    const search = entry.nasaId ? `nasa_id=${encodeURIComponent(entry.nasaId)}` : `q=${encodeURIComponent(entry.query ?? '')}&media_type=image`;
    const response = await getJson(`https://images-api.nasa.gov/search?${search}`);
    const items: LibraryItem[] = response.collection?.items ?? [];
    const score = (item: LibraryItem) => {
      const title = item.data?.[0]?.title.toLowerCase() ?? '';
      return (title.includes(machine.name.toLowerCase()) ? 2 : 0) + (entry.query?.toLowerCase().includes('first flight') && title.includes('first') ? 10 : 0) + (entry.query?.toLowerCase().includes('self-portrait') && title.includes('self') ? 5 : 0);
    };
    const item = items.filter(item => acceptablePhoto(item, machine, entry.query)).sort((a, b) => score(b) - score(a))[0];
    const data = item?.data?.[0];
    let photo: Photo;
    if (data) {
      const assets = await getJson(`https://images-api.nasa.gov/asset/${encodeURIComponent(data.nasa_id)}`);
      const urls: string[] = (assets.collection?.items ?? []).map((asset: { href: string }) => asset.href).filter((url: string) => /\.jpe?g($|\?)/i.test(url));
      const imageUrl = urls.find(url => /~medium\./i.test(url)) ?? urls.find(url => /~large\./i.test(url)) ?? urls[0];
      if (!imageUrl) throw new Error(`TODO(source): no JPEG for ${data.nasa_id}`);
      photo = { id: `${machine.id}-${index + 1}`, machineId: machine.id, nasaId: data.nasa_id, title: data.title, credit: data.secondary_creator ?? data.photographer ?? (data.center ? `NASA/${data.center}` : 'TODO(source): image credit'), sourceUrl: `https://images.nasa.gov/details/${data.nasa_id}`, imageUrl, dateTaken: data.date_created ?? null, alt: data.title.replace(/[.!?]+$/, '') + '.', caption: data.title };
    } else if (entry.nasaId && ['PIA00452', 'PIA23645', 'PIA00451', 'PIA00563'].includes(entry.nasaId)) {
      const sourceUrl = `https://photojournal.jpl.nasa.gov/catalog/${entry.nasaId}`;
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`TODO(source): Photojournal metadata unavailable for ${entry.nasaId}`);
      const html = await response.text();
      const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      const title = rawTitle?.replace(/\s+/g, ' ').replace(/^PIA\d+:\s*/, '').replace(/\s*\|.*$/, '').trim();
      if (!title) throw new Error(`TODO(source): missing Photojournal title for ${entry.nasaId}`);
      photo = { id: `${machine.id}-${index + 1}`, machineId: machine.id, nasaId: entry.nasaId, title, credit: 'NASA/JPL-Caltech', sourceUrl, imageUrl: `https://photojournal.jpl.nasa.gov/jpeg/${entry.nasaId}.jpg`, dateTaken: null, alt: title.replace(/[.!?]+$/, '') + '.', caption: title };
    } else {
      photo = { id: `${machine.id}-${index + 1}`, machineId: machine.id, nasaId: '', title: 'TODO(source)', credit: 'TODO(source)', sourceUrl: `https://images-api.nasa.gov/search?${search}`, imageUrl: '', dateTaken: null, alt: '', caption: '', todo: true, note: `TODO(source): no qualifying NASA photo for ${machine.id}: ${entry.query ?? entry.nasaId}` };
    }
    if (data?.description) photo.description = data.description;
    if (entry.role) photo.role = entry.role;
    if (entry.role === 'pale-blue-dot' || entry.role === 'pale-blue-dot-revisited') photo.earthMarker = null;
    manifest.push(photo);
  }
  return manifest;
}