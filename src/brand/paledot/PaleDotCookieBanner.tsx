import { useEffect, useState } from "react";
import { notifyConsentChange } from "@/components/GoogleAnalytics";

import { useLanguage } from "@/i18n/LanguageContext";
import { PALEDOT_COPY } from "./copy";

const COOKIE_CONSENT_KEY = "cookie-consent";

/**
 * The paledot.org cookie banner. Same consent storage as the Cosmos banner, styled with the
 * Pale Dot brand: hairline border, surface fill, DM Mono label, dot-accented accept pill.
 * Sits bottom-left so it never covers the "by Dens Akoka" credit at bottom-right.
 */
export function PaleDotCookieBanner() {
  const { language } = useLanguage();
  const t = (PALEDOT_COPY[language as "en" | "fr"] ?? PALEDOT_COPY.en).cookies;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
      setIsVisible(true);
    }
  }, []);

  const choose = (value: "accepted" | "declined") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    notifyConsentChange(value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label={t.label}
      className="paledot dark fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:max-w-sm"
      style={{ colorScheme: "dark" }}
    >
      <div
        className="rounded-lg border p-4 backdrop-blur-md"
        style={{
          background: "hsl(var(--surface) / 0.85)",
          borderColor: "hsl(var(--border))",
          fontFamily: "var(--font-ui)",
        }}
      >
        <p
          className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ fontFamily: "var(--font-mono)", color: "hsl(var(--muted-foreground))" }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "hsl(var(--dot))", boxShadow: "0 0 12px hsl(var(--dot-glow) / 0.5)" }}
          />
          {t.label}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
          {t.message}{" "}
          <a
            href="https://dens.so/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "hsl(var(--foreground-strong))", textDecorationColor: "hsl(var(--border-strong))" }}
          >
            {t.privacy}
          </a>
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            data-action
            onClick={() => choose("declined")}
            className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              borderColor: "hsl(var(--border-strong))",
              color: "hsl(var(--foreground))",
              background: "transparent",
            }}
          >
            {t.decline}
          </button>
          <button
            type="button"
            data-action
            onClick={() => choose("accepted")}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--dot))", color: "hsl(var(--on-dot))" }}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
