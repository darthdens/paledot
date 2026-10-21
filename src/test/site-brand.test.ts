import { describe, expect, it } from "vitest";

import { brandFromHost } from "@/lib/site-brand";

describe("brandFromHost", () => {
  it("shows Pale Dot on paledot.org", () => {
    expect(brandFromHost("paledot.org")).toBe("paledot");
  });
  it("shows Pale Dot on www.paledot.org", () => {
    expect(brandFromHost("www.paledot.org")).toBe("paledot");
  });
  it("shows Cosmos Explorer on cosmos.dens.so", () => {
    expect(brandFromHost("cosmos.dens.so")).toBe("cosmos");
  });
  it("shows Cosmos Explorer on the Lovable URL", () => {
    expect(brandFromHost("cosmosexplorer.lovable.app")).toBe("cosmos");
  });
  it("lets ?site=paledot preview Pale Dot anywhere", () => {
    expect(brandFromHost("cosmos.dens.so", "?site=paledot")).toBe("paledot");
  });
});

import { buildHead } from "@/lib/site-meta";
describe("buildHead", () => {
  it("gives Pale Dot its own share image", () => {
    expect(buildHead("paledot").meta).toContainEqual({ property: "og:image", content: "https://paledot.org/paledot/og.png" });
  });
});
