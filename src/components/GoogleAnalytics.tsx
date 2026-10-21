import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-XXQ66PCQ3G";
const COOKIE_CONSENT_KEY = "cookie-consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GoogleAnalytics = () => {
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    
    if (consent !== "accepted") {
      return;
    }

    // Check if gtag is already loaded
    if (typeof window.gtag === "function") {
      return;
    }

    // Load the gtag.js script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);

    return () => {
      // Cleanup script on unmount if needed
      const existingScript = document.querySelector(
        `script[src*="googletagmanager.com/gtag/js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Also listen for consent changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY && e.newValue === "accepted") {
        // Reload to initialize GA
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return null;
};
