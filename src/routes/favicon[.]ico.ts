// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createFileRoute } from '@tanstack/react-router';
import { getSiteBrand } from '@/lib/get-site-brand';
import { fileResponse } from '@/features/left-behind/lib/fileResponse';

function serveIcon(request: Request) {
  const path = getSiteBrand() === 'paledot' ? '/paledot/favicon.ico' : '/cosmos/favicon.ico';
  return fileResponse(request, path, 'image/x-icon');
}

export const Route = createFileRoute('/favicon.ico')({
  server: { handlers: { GET: ({ request }) => serveIcon(request), HEAD: ({ request }) => serveIcon(request) } },
});