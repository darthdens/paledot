import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";

import { useSiteBrand } from "@/lib/site-brand";
import { buildHead } from '@/lib/site-meta';
import { getSiteBrand } from '@/lib/get-site-brand';

// The 3D explorer only runs in the browser, so both pages load after the
// first paint. Page titles and link previews are already set by the server.
const Cosmos = lazy(() => import("@/pages/Cosmos"));
const PaleDot = lazy(() => import("@/pages/PaleDot"));

export const Route = createFileRoute("/")({
  head: () => ({ meta: buildHead(getSiteBrand()).meta }),
  component: Home,
});

function Home() {
  const brand = useSiteBrand();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fallback =
    brand === "paledot" ? (
      <div className="fixed inset-0" style={{ backgroundColor: "#0A0B10" }} />
    ) : null;

  if (!mounted) return fallback;
  return <Suspense fallback={fallback}>{brand === "paledot" ? <PaleDot /> : <Cosmos />}</Suspense>;
}
