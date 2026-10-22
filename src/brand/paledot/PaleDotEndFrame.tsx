import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotWordmark } from "./PaleDotWordmark";
import { setupPaleDotMotion } from "./paledotMotion";
import { PALEDOT_COPY } from "./copy";

/**
 * End-of-journey frame. Mounted over the explorer after the guided tour finishes or when the
 * camera reaches the edge of the observable universe. The lone dot holds, then the wordmark reveals.
 */
export function PaleDotEndFrame({
  distance,
  onAgain,
  onHome,
  onShare,
}: {
  distance: string;
  onAgain: () => void;
  onHome?: () => void;
  onShare?: () => void;
}) {
  const { tr } = useLanguage();
  const t = tr(PALEDOT_COPY as unknown as { en: typeof PALEDOT_COPY.en });
  const stageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

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
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pale Dot", text: t.descriptor, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      /* fall through */
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={stageRef}
      className="paledot dark pd-stage fixed inset-0 z-50"
      style={{ position: "fixed", inset: 0, zIndex: 30000, height: "100dvh" }}
      data-cosmos-container
    >
      <PaleDotWordmark lit idPrefix="pd-end" />
      <p className="pd-desc">{t.descriptor}</p>
      <div className="pd-actions">
        <button type="button" data-action className="pd-pill pd-primary" onClick={onAgain}>{t.again}</button>
        {onHome && (
          <button type="button" data-action className="pd-pill" onClick={onHome}>{t.home}</button>
        )}
        <button type="button" data-action className="pd-pill" onClick={share} aria-live="polite">
          {copied ? t.copied : t.share}
        </button>
      </div>
      <div className="pd-readout">
        <div className="pd-hud-label">{t.distanceLabel}</div>
        <div className="pd-hud-readout">
          {distance}
        </div>
      </div>
      <p className="pd-credit">
        {t.credit}{" "}
        <a href="https://dens.so" target="_blank" rel="noopener noreferrer">{t.author}</a>
      </p>
    </div>
  );
}
