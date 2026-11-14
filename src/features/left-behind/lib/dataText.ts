// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import data from './dataTranslations.json';
type Lang = 'en' | 'fr' | 'es' | 'pt' | 'it' | 'de';
const strings = data.strings as Record<string, Record<string, string>>;
const captions = data.captions as Record<string, Record<string, string>>;
/** Translation of an English hardware.json string; facts stay as written in English when no translation exists. */
export function dataText(text: string, lang: Lang) { return lang === 'en' ? text : strings[lang]?.[text] ?? text; }
export function captionText(id: string, caption: string | Record<string, string>, lang: Lang) {
  if (typeof caption === 'string') return caption;
  return caption[lang] ?? captions[id]?.[lang] ?? caption['en'] ?? '';
}
