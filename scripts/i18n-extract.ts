// Collects every English UI string used by the explorer and Pale Dot.
// Usage: bun scripts/i18n-extract.ts > /tmp/strings.json
import { readFileSync } from "node:fs";
import { Glob } from "bun";
import { translations } from "../src/i18n/translations";
import { PALEDOT_COPY } from "../src/brand/paledot/copy";

const out = new Set<string>();
const add = (v: unknown) => {
  if (typeof v === "string") { if (/[A-Za-z]/.test(v)) out.add(v); }
  else if (Array.isArray(v)) v.forEach(add);
  else if (v && typeof v === "object") Object.values(v).forEach(add);
};

const STR = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;
const unq = (s: string) => Function(`return ${s}`)() as string;

const files = [
  ...new Glob("src/components/cosmos/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("src/brand/paledot/**/*.tsx").scanSync("."),
  "src/pages/Cosmos.tsx", "src/pages/PaleDot.tsx",
];

const matchBrace = (s: string, start: number) => {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"' || c === "`") { const q = c; i++; while (i < s.length && s[i] !== q) { if (s[i] === "\\") i++; i++; } continue; }
    if (c === "{" || c === "[") depth++;
    if (c === "}" || c === "]") { depth--; if (depth === 0) return i; }
  }
  return -1;
};

for (const f of files) {
  const s = readFileSync(f, "utf8");
  // local `const translations = { en: {...}, fr: {...} }`
  const m = s.match(/const translations\s*=\s*\{/);
  if (m && m.index !== undefined) {
    const start = s.indexOf("{", m.index);
    const end = matchBrace(s, start);
    const obj = Function(`return ${s.slice(start, end + 1)}`)();
    add(obj.en);
  }
  // { en: '...' } and { en: [ ... ] } and changes_en: [ ... ]
  for (const mm of s.matchAll(new RegExp(String.raw`\ben:\s*(${STR})`, "g"))) add(unq(mm[1]));
  for (const mm of s.matchAll(/\b(?:en|changes_en):\s*\[/g)) {
    const start = mm.index! + mm[0].length - 1;
    const end = matchBrace(s, start);
    try { add(Function(`return ${s.slice(start, end + 1)}`)()); } catch {}
  }
  // tx('English', 'French')
  for (const mm of s.matchAll(new RegExp(String.raw`\btx\(\s*(${STR})`, "g"))) add(unq(mm[1]));
}

const t = translations.en;
add([t.nav, t.footer, t.notFound, t.cookies]);
add(PALEDOT_COPY.en);

console.log(JSON.stringify([...out].sort(), null, 1));
