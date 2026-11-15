// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { createFileRoute } from '@tanstack/react-router';
import video from '@/assets/documents/paledot-left-behind-vertical.mp4.asset.json';
import { fileResponse } from '@/features/left-behind/lib/fileResponse';

export const Route = createFileRoute('/files/paledot-left-behind-vertical.mp4')({
  server: { handlers: {
    GET: ({ request }) => fileResponse(request, video.url, 'video/mp4', video.original_filename),
    HEAD: ({ request }) => fileResponse(request, video.url, 'video/mp4', video.original_filename),
  } },
});