import { useEffect, useRef } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotWordmark } from "./PaleDotWordmark";
import { setupPaleDotMotion } from "./paledotMotion";
import { PALEDOT_COPY } from "./copy";

/**
 * End-of-journey frame. Mount it (over the explorer) once the camera has reached the edge of the
 * observable universe; the explorer should fade its own scene to black over ~1.6s first.
 * The lone dot holds, then the wordmark reveals from it. No stars here: the dot is the last thing left.
 */
export function PaleDotEndFrame({ distance, onAgain, onShare }: { distance: string; onAgain: () => void; onShare?: () => void }) {
  const { language, tr } = useLanguage();
  const t = tr(PALEDOT_COPY as unknown as { en: typeof PALEDOT_COPY.en });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const motion = setupPaleDotMotion(stage);
    motion.endOfJourney();
    return () => motion.destroy();
  }, []);

  const share = async () => {
    if (onShare) return onShare();
    const url = "https://paledot.org/";
    try {
      if (navigator.share) await navigator.share({ title: "Pale Dot", text: t.descriptor, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* user cancelled */ }
  };

  return (
    <div ref={stageRef} className="paledot dark pd-stage fixed inset-0 z-50" style={{ position: "fixed", inset: 0, zIndex: 30000, height: "100dvh" }} data-cosmos-container>
      <PaleDotWordmark lit idPrefix="pd-end" />
      <p className="pd-desc">{t.descriptor}</p>
      <div className="pd-actions">
        <button type="button" data-action className="pd-pill pd-primary" onClick={onAgain}>{t.again}</button>
        <button type="button" data-action className="pd-pill" onClick={share}>{t.share}</button>
      </div>
      <div className="pd-readout">
        <div className="pd-hud-label">{t.distanceLabel}</div>
        <div className="pd-hud-readout" style={{ fontSize: "clamp(18px, 5.2vw, 28px)", lineHeight: 1.2, whiteSpace: "nowrap" }}>{distance}</div>
      </div>
      <p className="pd-credit">
        {t.credit}{" "}
        <a href="https://dens.so" target="_blank" rel="noopener noreferrer">{t.author}</a>
      </p>
    </div>
  );
}
