import { useEffect, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { CookieBanner } from "@/components/CookieBanner";
import { PaleDotCookieBanner } from "@/brand/paledot/PaleDotCookieBanner";
import CustomCursor from "@/components/CustomCursor";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import NotFound from "@/pages/NotFound";
import { getSiteBrand } from "@/lib/get-site-brand";
import { SiteBrandContext } from "@/lib/site-brand";
import { buildHead } from "@/lib/site-meta";
import { PALEDOT_HEAD_LINKS } from "@/brand/paledot/siteMeta.paledot";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => ({ brand: getSiteBrand() }),
  head: ({ loaderData }) => {
    const brand = loaderData?.brand ?? "cosmos";
    const { meta, canonical, jsonLd } = buildHead(brand);
    const icons = brand === "paledot" ? PALEDOT_HEAD_LINKS : [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
        { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/apple-touch-icon.png" },
      ];
    return {
      meta,
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "canonical", href: canonical },
        ...icons,
      ],
      scripts: [
        { type: "application/ld+json", children: jsonLd },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Echo AI chat widget (unchanged script). Added after the page is interactive,
// because the widget adds its own elements to the page and must not race the
// first render.
function useEchoWidget(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (document.querySelector('script[src="https://echoai.so/w.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://echoai.so/w.js";
    script.async = true;
    script.setAttribute("data-echo", "dens");
    document.body.appendChild(script);
  }, [enabled]);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { brand } = Route.useLoaderData();
  useEchoWidget(brand === "cosmos");
  return (
    <SiteBrandContext.Provider value={brand}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            {brand === "cosmos" && <CustomCursor />}
            {brand === "cosmos" && <BackgroundLayer />}
            <Toaster richColors position="bottom-left" />
            <GoogleAnalytics brand={brand} />
            {brand === "cosmos" ? <CookieBanner /> : <PaleDotCookieBanner />}
            <Outlet />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </SiteBrandContext.Provider>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-md space-y-4">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="text-muted-foreground">Something went wrong. You can try again or go home.</p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground border border-border"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <Link to="/" className="px-4 py-2 rounded-md border border-border">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
