import { useEffect, useRef } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotWordmark } from "./PaleDotWordmark";
import { setupPaleDotMotion } from "./paledotMotion";
import { PALEDOT_COPY } from "./copy";
import { PaleDotStars } from "./PaleDotStars";
import { Button } from '@/components/ui/button';
import { leftBehindCopy } from '@/features/left-behind/lib/copy';

/**
 * The paledot.org title screen. Replaces the intro in src/pages/PaleDot.tsx.
 * The wordmark reveals from a single dot at the centre of the screen; the descriptor and the
 * "Begin at Earth" pill follow. Click anywhere to skip. Credit links to dens.so in a new tab.
 */
export function PaleDotTitleScreen({ onBegin, onLeftBehind }: { onBegin: () => void; onLeftBehind: () => void }) {
  const { language, tr } = useLanguage();
  const t = tr(PALEDOT_COPY as unknown as { en: typeof PALEDOT_COPY.en });
  const universeSubtitle = { en: 'Observable universe', fr: 'Univers observable', es: 'Universo observable', pt: 'Universo observável', it: 'Universo osservabile', de: 'Beobachtbares Universum' }[language];
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const motion = setupPaleDotMotion(stage);
    const id = window.setTimeout(motion.reveal, 300);
    return () => { window.clearTimeout(id); motion.destroy(); };
  }, []);

  return (
    <div
      ref={stageRef}
      className="paledot dark pd-stage fixed inset-0"
      style={{ height: "100dvh", colorScheme: "dark" }}
      data-cosmos-container
    >
      <PaleDotStars />
      <div className="pd-hud-corner tl">
        <span className="pd-hud-label">{t.youAreHere}</span>
        <span className="pd-hud-value">{t.earthLocation}</span>
      </div>
      <div className="pd-hud-corner tr">
        <span className="pd-hud-label">{t.scaleLabel}</span>
        <span className="pd-hud-value">1 px = 10 km</span>
      </div>
      <PaleDotWordmark lit />
      <p className="pd-desc">{t.descriptor}</p>
      <div className="pd-actions items-center">
        <Button type="button" variant="outline" data-action className="pd-pill h-auto min-h-11 w-64 max-w-full flex-col" onClick={onBegin}>
          <span className="block leading-5">{t.begin}</span>
          <span className="block text-[10px] leading-4 text-muted-foreground">({tr({ en: universeSubtitle, fr: universeSubtitle })})</span>
        </Button>
        <Button type="button" variant="outline" data-action className="pd-pill h-auto min-h-11 w-64 max-w-full flex-col" onClick={onLeftBehind}>
          <span className="block leading-5">{tr({ en: leftBehindCopy[language].name, fr: leftBehindCopy[language].name })}</span>
          <span className="block text-[10px] leading-4 text-muted-foreground">(NASA Space Apps Challenge)</span>
        </Button>
      </div>
      <div className="pd-readout">
        <div className="pd-hud-label">{t.distanceLabel}</div>
        <div className="pd-hud-readout">0 km</div>
      </div>
      <p className="pd-credit">
        {t.credit}{" "}
        <a href="https://dens.so" target="_blank" rel="noopener noreferrer">
          {t.author}
        </a>
      </p>
    </div>
  );
}
