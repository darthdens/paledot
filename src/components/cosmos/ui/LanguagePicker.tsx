import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { FlagIcon } from './FlagIcon';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/i18n/LanguageContext';
import { LOCALES } from '@/i18n/locales';

const LanguageList = ({ onPick }: { onPick?: () => void }) => {
  const { locale, setLocale } = useLanguage();
  return (
    <div role="listbox" className="space-y-0.5">
      {LOCALES.map((l) => (
        <Button
          variant="ghost"
          key={l.code}
          role="option"
          aria-selected={locale === l.code}
          lang={l.code}
          onClick={() => { setLocale(l.code); onPick?.(); }}
          className={`w-full min-h-11 h-auto grid grid-cols-[minmax(0,1fr)_16px] items-center justify-between gap-3 px-2 py-2 rounded-sm text-sm font-normal transition-colors ${
            locale === l.code ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <FlagIcon locale={l.code} className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{l.label}</span>
          </span>
          <span className="w-4 h-4 shrink-0">{locale === l.code && <Check className="w-4 h-4" />}</span>
        </Button>
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
        <Button
          variant="ghost"
          key={l.code}
          role="option"
          aria-selected={locale === l.code}
          lang={l.code}
          onClick={() => { setLocale(l.code); onPick?.(); }}
          className={`w-full min-h-11 h-auto grid grid-cols-[minmax(0,1fr)_16px] items-center gap-3 p-2 rounded-sm font-normal transition-colors ${locale === l.code ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60'}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FlagIcon locale={l.code} className="w-4 h-4 shrink-0" />
            <span className="text-sm whitespace-nowrap">{l.label}</span>
          </div>
          <span className="w-4 h-4 shrink-0">{locale === l.code && <Check className="w-4 h-4" />}</span>
        </Button>
      ))}
    </div>
  );
};

/** Globe button for the desktop toolbar. */
export const LanguageButton = () => {
  const { tx, locale } = useLanguage();
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
            <FlagIcon locale={locale} className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="dark" side="bottom">
          {tx('Language', 'Langue')}
        </TooltipContent>
      </Tooltip>
      <div data-language-dropdown inert={!open}
        className={`absolute right-0 top-[calc(100%+8px)] z-[10001] w-[200px] max-w-[calc(100vw-16px)] overflow-hidden rounded-lg bg-card/97 backdrop-blur-xs text-foreground transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0 overflow-hidden"><div className="p-2"><LanguageList onPick={() => setOpen(false)} /></div></div>
        </div>
      </div>
    </div>
  );
};
