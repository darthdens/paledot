// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";

// Sitemap is generated before dev and before build so it always lists the
// current public routes. Admin/404 pages are left out.
const SITE_URL = "https://cosmos.dens.so";
const PUBLIC_ROUTES = ["/"];

function generateSitemap() {
  const urls = PUBLIC_ROUTES.map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`).join(
    "\n",
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync("public/sitemap.xml", xml);
}

const sitemapPlugin = () => ({
  name: "generate-sitemap",
  buildStart() {
    generateSitemap();
  },
});

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [sitemapPlugin()],
  },
});
