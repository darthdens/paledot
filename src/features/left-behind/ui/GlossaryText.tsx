// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { glossaryData } from '../lib/glossaryData';
const seen = new Set<string>();
function Term({ word, definition }: { word: string; definition: string }) {
  const [open, setOpen] = useState(false);
  return <span className="relative inline">
    <Button variant="link" type="button" aria-expanded={open} className="inline h-auto p-0 text-inherit text-[length:inherit] font-normal underline decoration-dotted underline-offset-4" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(v => !v)} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}>{word}</Button>
    {open && <span role="tooltip" className="block my-2 rounded-md border border-border bg-card p-3 text-xs text-foreground leading-relaxed sm:absolute sm:bottom-full sm:left-0 sm:z-[10030] sm:mb-2 sm:w-64">{definition}</span>}
  </span>;
}
export function GlossaryText({ text, scope = 'shared' }: { text: string; scope?: string }) {
  const { language, tr } = useLanguage();
  const parts = useMemo(() => {
    const result: ReactNode[] = [];
    const candidates = glossaryData.filter(g => !seen.has(`${scope}:${language}:${g.id}`));
    let cursor = 0;
    const lower = text.toLocaleLowerCase();
    while (cursor < text.length) {
      const hits = candidates.map(g => ({ g, at: lower.indexOf(g.terms[language].toLocaleLowerCase(), cursor) })).filter(h => h.at >= cursor).sort((a, b) => a.at - b.at);
      const hit = hits[0];
      if (!hit) { result.push(text.slice(cursor)); break; }
      result.push(text.slice(cursor, hit.at));
      const word = text.slice(hit.at, hit.at + hit.g.terms[language].length);
      result.push(<Term key={hit.at} word={word} definition={tr({ en: hit.g.definitions[language], fr: hit.g.definitions[language] })} />);
      seen.add(`${scope}:${language}:${hit.g.id}`);
      candidates.splice(candidates.indexOf(hit.g), 1);
      cursor = hit.at + word.length;
    }
    return result;
  }, [text, scope, language, tr]);
  return <>{parts}</>;
}