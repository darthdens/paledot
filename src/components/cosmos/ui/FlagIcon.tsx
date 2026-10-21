import type { Locale } from '@/i18n/locales';
import gb from '@/assets/flags/gb.svg';
import us from '@/assets/flags/us.svg';
import fr from '@/assets/flags/fr.svg';
import es from '@/assets/flags/es.svg';
import pt from '@/assets/flags/pt.svg';
import it from '@/assets/flags/it.svg';
import de from '@/assets/flags/de.svg';

const FLAGS: Record<Locale, string> = {
  'en-GB': gb,
  'en-US': us,
  fr,
  es,
  pt,
  it,
  de,
};

/** Circular country flag for a language (rendered from bundled SVG, no network). */
export const FlagIcon = ({ locale, className }: { locale: Locale; className?: string }) => (
  <img
    src={FLAGS[locale]}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={`${className ?? ''} select-none`}
  />
);
