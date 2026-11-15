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
it('forwards byte ranges for native PDF readers', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('PDF', { status: 206, headers: { 'content-range': 'bytes 0-2/701032' } }));
  vi.stubGlobal('fetch', fetcher);
  const response = await fileResponse(new Request('https://paledot.org/files/paledot-left-behind-deck.pdf', { headers: { Range: 'bytes=0-2' } }), '/asset.pdf', 'application/pdf');
  expect(fetcher.mock.calls[0]?.[1].headers.get('range')).toBe('bytes=0-2');
  expect(response.status).toBe(206);
  expect(response.headers.get('content-range')).toBe('bytes 0-2/701032');
});