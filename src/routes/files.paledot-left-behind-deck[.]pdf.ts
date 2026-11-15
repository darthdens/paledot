// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createFileRoute } from '@tanstack/react-router';
import deck from '@/assets/documents/paledot-left-behind-deck.pdf.asset.json';

export const Route = createFileRoute('/files/paledot-left-behind-deck.pdf')({
  server: { handlers: { GET: ({ request }) => Response.redirect(new URL(deck.url, request.url), 302) } },
});