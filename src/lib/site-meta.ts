import type { SiteBrand } from "./site-brand";

const DENS_BANNER =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/ec13kXpRjVTkAQHkK5GwP0G1VtU2/social-images/social-1767715217204-dens-banner-1.png";

type SiteMeta = {
  name: string;
  title: string;
  description: string;
  url: string;
  image?: string;
};

export const SITE_META: Record<SiteBrand, SiteMeta> = {
  cosmos: {
    name: "Cosmos Explorer",
    title: "Cosmos Explorer | By Dens",
    description: "An interactive 3D journey from Earth to the edge of the observable universe.",
    url: "https://cosmos.dens.so/",
    image: DENS_BANNER,
  },
  paledot: {
    name: "Pale Dot",
    title: "Pale Dot: explore the observable universe",
    description:
      "Start from Earth, our pale blue dot, and travel in 3D through planets, stars and galaxies to the edge of the observable universe.",
    url: "https://paledot.org/",
    // Pale Dot share image arrives with the brand assets.
  },
};

export function buildHead(brand: SiteBrand) {
  const m = SITE_META[brand];
  const meta: Array<Record<string, string>> = [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
    { title: m.title },
    { name: "description", content: m.description },
    { name: "author", content: "Dens" },
    { name: "theme-color", content: "#0a0a0f" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: m.name },
    { property: "og:title", content: m.title },
    { property: "og:description", content: m.description },
    { property: "og:url", content: m.url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@densecho" },
    { name: "twitter:title", content: m.title },
    { name: "twitter:description", content: m.description },
  ];
  if (m.image) {
    meta.push({ property: "og:image", content: m.image }, { name: "twitter:image", content: m.image });
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: m.name,
    url: m.url,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, iPadOS, macOS, visionOS",
    description: m.description,
    author: { "@type": "Person", name: "Dens" },
  };
  return { meta, canonical: m.url, jsonLd: JSON.stringify(jsonLd) };
}
