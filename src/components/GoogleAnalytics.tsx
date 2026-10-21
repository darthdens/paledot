import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-XXQ66PCQ3G";
const COOKIE_CONSENT_KEY = "cookie-consent";
export const CONSENT_EVENT = "cookie-consent-change";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** Both cookie banners call this after saving the choice so counting starts right away. */
export function notifyConsentChange(value: "accepted" | "declined") {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

function loadAnalytics(brand: string) {
  if (typeof window.gtag === "function") return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // site_brand lets Pale Dot and Cosmos visits be told apart in reports.
  window.gtag("config", GA_MEASUREMENT_ID, { site_brand: brand });
}

export const GoogleAnalytics = ({ brand }: { brand: string }) => {
  useEffect(() => {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted") loadAnalytics(brand);

    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === "accepted") loadAnalytics(brand);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY && e.newValue === "accepted") loadAnalytics(brand);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("storage", onStorage);
    };
  }, [brand]);

  return null;
};
