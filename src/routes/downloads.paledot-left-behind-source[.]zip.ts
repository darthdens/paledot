// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createFileRoute } from '@tanstack/react-router';
import sourcePackage from '../../public/downloads/paledot-left-behind-source.zip.asset.json';

export const Route = createFileRoute('/downloads/paledot-left-behind-source.zip')({
  server: {
    handlers: {
      GET: ({ request }) => Response.redirect(new URL(sourcePackage.url, request.url), 302),
    },
  },
});