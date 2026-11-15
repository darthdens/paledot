// Drop-in replacements for src/lib/site-meta.ts (the paledot entry and the head builder).
// Keeps the cosmos entry untouched.

export const PALEDOT_META = {
  name: "Pale Dot",
  title: "Pale Dot — From Earth to the edge of everything",
  description:
    "An interactive 3D journey from Earth to the edge of the observable universe: planets, stars, galaxies and the cosmic web at true scale. By Dens Akoka.",
  url: "https://paledot.org/",
  image: "https://paledot.org/paledot/og.png", // 1200×630, absolute URL on purpose (link previews)
  imageAlt: "paledot — From Earth to the edge of everything",
  themeColor: "#0A0B10",
  author: "Dens Akoka",
  authorUrl: "https://dens.so",
};

// In buildHead(brand): use m.themeColor / m.author when present, add og:image:width/height/alt,
// and give the JSON-LD author a url. The cosmos brand keeps its current values.
export const PALEDOT_EXTRA_META = [
  { name: "author", content: PALEDOT_META.author },
  { name: "theme-color", content: PALEDOT_META.themeColor },
  { property: "og:image", content: PALEDOT_META.image },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: PALEDOT_META.imageAlt },
  { name: "twitter:image", content: PALEDOT_META.image },
  { name: "twitter:image:alt", content: PALEDOT_META.imageAlt },
];

// Head links for the paledot brand (replace the four favicon links in src/routes/__root.tsx when brand === "paledot").
export const PALEDOT_HEAD_LINKS = [
  { rel: "icon", type: "image/svg+xml", href: "/paledot/favicon.svg" },
  { rel: "icon", href: "/paledot/favicon.ico", sizes: "16x16 32x32 48x48" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/paledot/favicon-32.png" },
  { rel: "icon", type: "image/png", sizes: "192x192", href: "/paledot/icon-192.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/paledot/apple-touch-icon.png" },
  { rel: "manifest", href: "/paledot/site.webmanifest" },
];

export const PALEDOT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: PALEDOT_META.name,
  url: PALEDOT_META.url,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, iOS, iPadOS, macOS, visionOS",
  description: PALEDOT_META.description,
  image: PALEDOT_META.image,
  author: { "@type": "Person", name: PALEDOT_META.author, url: PALEDOT_META.authorUrl },
};
