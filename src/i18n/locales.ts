// Supported interface languages. English (source) and French have hand-written
// copy everywhere; the other languages are looked up in per-language
// dictionaries keyed by the English text (see src/i18n/dict/*.json).

export type Locale = "en-GB" | "en-US" | "fr" | "es" | "pt" | "it" | "de";
export type ContentLang = "en" | "fr" | "es" | "pt" | "it" | "de";
export type DictLang = "es" | "pt" | "it" | "de";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "en-GB", label: "English (UK)", short: "EN" },
  { code: "en-US", label: "English (US)", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "es", label: "Español", short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
  { code: "it", label: "Italiano", short: "IT" },
  { code: "de", label: "Deutsch", short: "DE" },
];

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && LOCALES.some((l) => l.code === v);

export const contentLangOf = (locale: Locale): ContentLang =>
  locale === "en-GB" || locale === "en-US" ? "en" : locale;

export const numberLocaleOf = (locale: Locale): string =>
  ({ "en-GB": "en-GB", "en-US": "en-US", fr: "fr-FR", es: "es-ES", pt: "pt-PT", it: "it-IT", de: "de-DE" })[locale];

/** Regions where British spelling is standard (kept on UK English). */
const BRITISH_REGIONS = new Set([
  // British Isles
  "gb", "uk", "ie", "im", "je", "gg", "gi",
  // Oceania
  "au", "nz", "fj", "pg", "sb", "vu", "ws", "to", "ki", "tv", "nr", "pw",
  // Africa (anglophone)
  "za", "ng", "gh", "ke", "ug", "tz", "zw", "zm", "mw", "bw", "ls", "sz", "na",
  "gm", "sl", "lr", "rw", "mu", "sc", "so",
  // South & Southeast Asia
  "in", "pk", "bd", "lk", "np", "bt", "mv", "my", "sg", "bn", "hk", "mo",
  // Caribbean & Atlantic
  "jm", "tt", "bb", "bs", "gy", "bz", "ag", "dm", "gd", "kn", "lc", "vc",
  "ai", "vg", "ky", "ms", "tc", "bm", "fk", "sh",
  // Europe / Middle East
  "mt2", "il", "ae", "qa", "kw", "bh", "om", "jo",
]);

/** Pull the region subtag out of a lowercase BCP-47 tag, if any. */
const regionOf = (tag: string): string | undefined => {
  const m = tag.match(/-([a-z]{2})(?:$|-)/);
  return m?.[1];
};

/** Pure locale picker over browser language tags (testable). */
export const pickLocale = (langs: string[]): Locale => {
  const tags = langs.filter(Boolean).map((l) => l.toLowerCase());
  // A non-English preferred language wins outright.
  for (const l of tags) {
    for (const c of ["fr", "es", "pt", "it", "de"] as const) if (l.startsWith(c)) return c;
  }
  // English (or no match): region decides between UK and US spelling.
  const region = tags.map(regionOf).find(Boolean);
  return region !== undefined && BRITISH_REGIONS.has(region) ? "en-GB" : "en-US";
};

/** Pick the best browser language on first visit. */
export const detectLocale = (): Locale => {
  const langs = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  return pickLocale(langs);
};

// ---- US spelling ---------------------------------------------------------
const US_WORDS: [RegExp, string][] = [
  [/\bcolour/g, "color"], [/\bColour/g, "Color"],
  [/\bcentre/g, "center"], [/\bCentre/g, "Center"],
  [/metre/g, "meter"], [/\bgrey/g, "gray"], [/\bGrey/g, "Gray"],
  [/\bfavourite/g, "favorite"], [/\bbehaviour/g, "behavior"],
  [/\btravell(ing|ed|er)/g, "travel$1"], [/\bTravell(ing|ed|er)/g, "Travel$1"],
  [/\bneighbour/g, "neighbor"], [/\bNeighbour/g, "Neighbor"],
  [/\banalys(e|ed|ing)\b/g, "analyz$1"],
  [/\b(organ|real|visual|recogn|special|optim|categor|summar|harmon|stabil|vapor)is(e|ed|es|ing|ation)\b/gi, "$1iz$2"],
];
export const toUS = (s: string) => US_WORDS.reduce((acc, [re, rep]) => acc.replace(re, rep), s);

// ---- Deep localisation ---------------------------------------------------
type Dict = Record<string, string>;

const mapStrings = <T,>(value: T, fn: (s: string) => string): T => {
  if (typeof value === "string") return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = mapStrings(v, fn);
    return out as T;
  }
  return value;
};

const cache = new Map<string, WeakMap<object, unknown>>();

/**
 * Localise an English value (string, array or nested table) for a locale.
 * `fr` is the hand-written French version when available.
 */
export function localize<T>(en: T, fr: T | undefined, locale: Locale, dict: Dict | null): T {
  if (locale === "en-GB") return en;
  if (locale === "fr") return fr ?? en;
  const fn = locale === "en-US" ? toUS : (s: string) => (dict && dict[s]) || s;
  if (en && typeof en === "object") {
    const key = locale + (dict ? ":d" : "");
    let m = cache.get(key);
    if (!m) cache.set(key, (m = new WeakMap()));
    if (m.has(en as object)) return m.get(en as object) as T;
    const out = mapStrings(en, fn);
    m.set(en as object, out);
    return out;
  }
  return mapStrings(en, fn);
}

export const loadDict = (lang: DictLang): Promise<Dict> =>
  ({
    es: () => import("./dict/es.json"),
    pt: () => import("./dict/pt.json"),
    it: () => import("./dict/it.json"),
    de: () => import("./dict/de.json"),
  })[lang]().then((m) => (m.default ?? m) as Dict);
