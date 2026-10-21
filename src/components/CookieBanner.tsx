import { useState, useEffect } from "react";
import { notifyConsentChange } from "@/components/GoogleAnalytics";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

const COOKIE_CONSENT_KEY = "cookie-consent";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    notifyConsentChange("accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    notifyConsentChange("declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-xs border-t border-border shadow-lg animate-in slide-in-from-bottom-4 duration-300">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          {t.cookies.message}{" "}
          <a href="https://dens.so/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            {t.cookies.privacyLink}
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            {t.cookies.decline}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t.cookies.accept}
          </Button>
        </div>
      </div>
    </div>
  );
};
