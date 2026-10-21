import { createFileRoute } from "@tanstack/react-router";
import { brandFromHost } from "@/lib/site-brand";

const ORIGINS = { paledot: "https://paledot.org", cosmos: "https://cosmos.dens.so" } as const;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const brand = brandFromHost(
          request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
          url.search,
        );
        const agents = ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit", "*"];
        const body =
          agents.map((a) => `User-agent: ${a}\nAllow: /\n`).join("\n") +
          `\nSitemap: ${ORIGINS[brand]}/sitemap.xml\n`;
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
