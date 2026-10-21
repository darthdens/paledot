import { createFileRoute } from "@tanstack/react-router";
import { brandFromHost } from "@/lib/site-brand";

// Each address lists its own pages: paledot.org -> paledot.org URLs, else cosmos.dens.so.
const ORIGINS = { paledot: "https://paledot.org", cosmos: "https://cosmos.dens.so" } as const;
const PUBLIC_ROUTES = ["/"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const brand = brandFromHost(
          request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
          url.search,
        );
        const origin = ORIGINS[brand];
        const urls = PUBLIC_ROUTES.map((r) => `  <url><loc>${origin}${r}</loc></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
