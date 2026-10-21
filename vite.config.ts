import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Sitemap is generated before dev and before build so it always lists the
// current public routes. Admin/404 pages are left out.
const SITE_URL = "https://cosmos.dens.so";
const PUBLIC_ROUTES = ["/"];

function generateSitemap() {
  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url><loc>${SITE_URL}${route}</loc></url>`
  ).join("\n");
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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [sitemapPlugin(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
