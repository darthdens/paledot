// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { afterEach, expect, it, vi } from 'vitest';
import { fileResponse } from './fileResponse';

afterEach(() => vi.unstubAllGlobals());
it('serves the PDF at /files without a redirect', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('%PDF-1.7', { headers: { 'content-length': '8' } })));
  const response = await fileResponse(new Request('https://paledot.org/files/paledot-left-behind-deck.pdf'), '/asset.pdf', 'application/pdf', 'paledot-left-behind-deck.pdf');
  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
  expect(response.headers.get('content-type')).toBe('application/pdf');
  expect(await response.text()).toBe('%PDF-1.7');
});
it.each(['paledot-left-behind.mp4', 'paledot-left-behind-vertical.mp4'])('serves %s at /files without redirecting', async (filename) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([0, 0, 0, 24]), { headers: { 'content-length': '4' } })));
  const response = await fileResponse(new Request(`https://paledot.org/files/${filename}`), `/assets/${filename}`, 'video/mp4', filename);
  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
  expect(response.headers.get('content-type')).toBe('video/mp4');
  expect(response.headers.get('content-disposition')).toBe(`inline; filename="${filename}"`);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0, 0, 0, 24]));
});
it('preserves partial video responses for seeking', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2]), { status: 206, headers: { 'content-range': 'bytes 100-101/5758078', 'accept-ranges': 'bytes' } }));
  vi.stubGlobal('fetch', fetcher);
  const response = await fileResponse(new Request('https://paledot.org/files/paledot-left-behind.mp4', { headers: { Range: 'bytes=100-101' } }), '/asset.mp4', 'video/mp4');
  expect(fetcher.mock.calls[0]?.[1].headers.get('range')).toBe('bytes=100-101');
  expect(response.status).toBe(206);
  expect(response.headers.get('content-range')).toBe('bytes 100-101/5758078');
});
it('returns video metadata without a body for HEAD', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { headers: { 'content-length': '6158102' } }));
  vi.stubGlobal('fetch', fetcher);
  const response = await fileResponse(new Request('https://paledot.org/files/paledot-left-behind-vertical.mp4', { method: 'HEAD' }), '/asset.mp4', 'video/mp4');
  expect(fetcher.mock.calls[0]?.[1].method).toBe('HEAD');
  expect(response.headers.get('content-length')).toBe('6158102');
  expect(await response.text()).toBe('');
});
it('forwards byte ranges for native PDF readers', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('PDF', { status: 206, headers: { 'content-range': 'bytes 0-2/701032' } }));
  vi.stubGlobal('fetch', fetcher);
  const response = await fileResponse(new Request('https://paledot.org/files/paledot-left-behind-deck.pdf', { headers: { Range: 'bytes=0-2' } }), '/asset.pdf', 'application/pdf');
  expect(fetcher.mock.calls[0]?.[1].headers.get('range')).toBe('bytes=0-2');
  expect(response.status).toBe(206);
  expect(response.headers.get('content-range')).toBe('bytes 0-2/701032');
});