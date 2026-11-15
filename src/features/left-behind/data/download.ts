// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export const LARGE_FILE_BYTES = 500_000;
export type DownloadProgress = { loaded: number; total: number | null };
const active = new Map<string, DownloadProgress>();
const listeners = new Set<() => void>();
let snapshot: ReadonlyArray<DownloadProgress> = [];
function publish() { snapshot = [...active.values()]; listeners.forEach(fn => fn()); }
export const downloadStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  snapshot: () => snapshot,
};
export function isLargeDownload(progress: DownloadProgress) {
  return (progress.total ?? progress.loaded) > LARGE_FILE_BYTES;
}
/** Stream only when requested, preserving native HTTP caching. No opening-screen prefetch. */
export async function downloadBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Asset download failed (${response.status})`);
  const total = Number(response.headers.get('content-length')) || null;
  const reader = response.body?.getReader();
  if (!reader) return response.blob();
  const chunks: BlobPart[] = [];
  let loaded = 0, last = 0;
  const key = `${url}:${performance.now()}`;
  try {
    if (total && total > LARGE_FILE_BYTES) { active.set(key, { loaded, total }); publish(); }
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      // Own the chunk buffer so Blob works with typed-array buffers across browsers.
      chunks.push(new Uint8Array(next.value).buffer);
      loaded += next.value.byteLength;
      if (isLargeDownload({ loaded, total }) && (performance.now() - last > 100 || loaded === total)) {
        active.set(key, { loaded, total }); publish(); last = performance.now();
      }
    }
    return new Blob(chunks, { type: response.headers.get('content-type') ?? 'application/octet-stream' });
  } finally { reader.releaseLock(); if (active.delete(key)) publish(); }
}