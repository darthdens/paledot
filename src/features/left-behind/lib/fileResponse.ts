// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
/** Stream a fixed public asset under its requested URL, including PDF ranges. */
export async function fileResponse(request: Request, assetPath: string, contentType: string, filename?: string) {
  const headers = new Headers();
  for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstream = await fetch(new URL(assetPath, request.url), { method: request.method === 'HEAD' ? 'HEAD' : 'GET', headers });
  const responseHeaders = new Headers();
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Cache-Control', 'public, max-age=3600');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  if (filename) responseHeaders.set('Content-Disposition', `inline; filename="${filename}"`);
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}