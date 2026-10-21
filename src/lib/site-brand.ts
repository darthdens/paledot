import { createContext, useContext } from "react";

/**
 * One app, two brands. The visitor's address decides which brand shows:
 * - paledot.org (and www.)   -> "paledot"
 * - everything else          -> "cosmos" (Cosmos Explorer by Dens)
 * Add `?site=paledot` or `?site=cosmos` to any URL to preview a brand.
 */
export type SiteBrand = "cosmos" | "paledot";

export function brandFromHost(host: string | null | undefined, search?: string | null): SiteBrand {
  const override = search ? new URLSearchParams(search).get("site") : null;
  if (override === "paledot" || override === "cosmos") return override;
  const hostname = (host ?? "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  return /(^|\.)paledot\.org$/.test(hostname) ? "paledot" : "cosmos";
}

export const SiteBrandContext = createContext<SiteBrand>("cosmos");

export const useSiteBrand = () => useContext(SiteBrandContext);
