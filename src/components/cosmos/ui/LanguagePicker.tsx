import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/i18n/LanguageContext';
import { LOCALES } from '@/i18n/locales';

const LanguageList = ({ onPick }: { onPick?: () => void }) => {
  const { locale, setLocale } = useLanguage();
  return (
    <div role="listbox" className="space-y-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          role="option"
          aria-selected={locale === l.code}
          lang={l.code}
          onClick={() => { setLocale(l.code); onPick?.(); }}
          className={`w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-[4px] text-sm transition-colors ${
            locale === l.code ? 'bg-white/25 text-white' : 'text-white/80 hover:bg-white/10'
          }`}
        >
          <span>{l.label}</span>
          {locale === l.code && <Check className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  );
};

/** List rows styled like the More-menu rows (Globe icon + label + active dot). */
export const LanguageMenuList = ({ onPick }: { onPick?: () => void }) => {
  const { locale, setLocale } = useLanguage();
  return (
    <div role="listbox" className="space-y-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          role="option"
          aria-selected={locale === l.code}
          lang={l.code}
          onClick={() => { setLocale(l.code); onPick?.(); }}
          className="w-full flex items-center justify-between gap-3 p-2 rounded-[4px] hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 shrink-0 text-white/70" />
            <span className="text-sm text-white/90 whitespace-nowrap">{l.label}</span>
          </div>
          {locale === l.code && <div className="w-2 h-2 shrink-0 rounded-full bg-green-400" />}
        </button>
      ))}
    </div>
  );
};

/** Globe button for the desktop toolbar. */
export const LanguageButton = () => {
  const { tx } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label={tx('Language', 'Langue')}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`h-9 w-9 backdrop-blur-xs text-white ${open ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <Globe className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="dark" side="bottom">
          {tx('Language', 'Langue')}
        </TooltipContent>
      </Tooltip>
      <div
        className={`absolute right-0 top-11 z-[10001] min-w-[200px] p-2 bg-white/10 backdrop-blur-xs rounded-lg transition-all duration-200 ease-out origin-top-right ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <LanguageList onPick={() => setOpen(false)} />
      </div>
    </div>
  );
};
