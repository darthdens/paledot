import { describe, expect, it } from "vitest";
import { pickLocale } from "@/i18n/locales";

// Rule: only countries likely to use British spelling fall back to UK
// English; everyone else gets US English.
describe("pickLocale", () => {
  it("gives UK English to British-spelling regions", () => {
    expect(pickLocale(["en-GB"])).toBe("en-GB");
    expect(pickLocale(["en-au"])).toBe("en-GB");
    expect(pickLocale(["en-IN"])).toBe("en-GB");
    expect(pickLocale(["en-ZA"])).toBe("en-GB");
    expect(pickLocale(["en-IE"])).toBe("en-GB");
  });

  it("gives US English to other English regions", () => {
    expect(pickLocale(["en-US"])).toBe("en-US");
    expect(pickLocale(["en-CA"])).toBe("en-US");
    expect(pickLocale(["en-FR"])).toBe("en-US");
  });

  it("gives US English when the English tag carries no region", () => {
    expect(pickLocale(["en"])).toBe("en-US");
    expect(pickLocale([])).toBe("en-US");
  });

  it("uses the region hint from other device languages when English has none", () => {
    expect(pickLocale(["en", "fr-GB".replace("fr-", "fr-")] ?? ["en"])).toBe("en-GB");
    expect(pickLocale(["en", "fr-FR"])).toBe("en-US");
    expect(pickLocale(["en", "de-DE"])).toBe("en-US");
  });

  it("still prefers a non-English device language", () => {
    expect(pickLocale(["fr-FR", "en-US"])).toBe("fr");
    expect(pickLocale(["es-MX", "en-GB"])).toBe("es");
    expect(pickLocale(["pt-BR", "en"])).toBe("pt");
    expect(pickLocale(["de-DE", "en"])).toBe("de");
    expect(pickLocale(["it-IT", "en"])).toBe("it");
  });
});
