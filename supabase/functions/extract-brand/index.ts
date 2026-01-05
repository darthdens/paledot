import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandColors {
  [key: string]: string | undefined;
}

// Merge colors from multiple pages, deduplicating by value
function mergeColors(existingColors: BrandColors, newColors: BrandColors): BrandColors {
  const merged = { ...existingColors };
  const existingValues = new Set(Object.values(existingColors).filter(Boolean));
  
  for (const [key, value] of Object.entries(newColors)) {
    if (value && !existingValues.has(value)) {
      // Find a unique key name
      let keyName = key;
      let counter = 1;
      while (merged[keyName]) {
        keyName = `${key}${counter}`;
        counter++;
      }
      merged[keyName] = value;
      existingValues.add(value);
    }
  }
  
  return merged;
}

// Merge fonts from multiple pages
function mergeFonts(existingFonts: Array<{ family: string }>, newFonts: Array<{ family: string }>): Array<{ family: string }> {
  const fontSet = new Set(existingFonts.map(f => f.family));
  const merged = [...existingFonts];
  
  for (const font of newFonts) {
    if (!fontSet.has(font.family)) {
      merged.push(font);
      fontSet.add(font.family);
    }
  }
  
  return merged;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, deep = false, maxPages = 5 } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured. Please connect Firecrawl in settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Extracting brand from URL: ${formattedUrl}, deep: ${deep}, maxPages: ${maxPages}`);

    const scrapedUrls = new Set<string>();
    scrapedUrls.add(formattedUrl);

    // Step 1: Always scrape the main page first
    const mainResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["branding", "screenshot", "links", "rawHtml"],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    const mainData = await mainResponse.json();

    if (!mainResponse.ok) {
      console.error("Firecrawl API error:", mainData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: mainData.error || `Failed to extract brand (status ${mainResponse.status})` 
        }),
        { status: mainResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let branding = mainData.data?.branding || mainData.branding || {};
    const screenshot = mainData.data?.screenshot || mainData.screenshot;
    const metadata = mainData.data?.metadata || mainData.metadata;
    let links = mainData.data?.links || mainData.links || [];
    let pagesScraped = 1;

    // Step 2: If deep mode, map and scrape additional pages
    if (deep) {
      console.log("Deep extraction mode enabled, mapping site...");
      
      try {
        const colorPrompt =
          "Extract all unique color values used or defined on this page (including CSS variables, inline styles, and style tags). Return JSON with a single key colors as an array of strings.";
        const colorSchema = {
          type: "object",
          properties: {
            colors: { type: "array", items: { type: "string" } },
          },
          required: ["colors"],
        };

        const extractColorsFromString = (value: string): string[] => {
          const v = value.toLowerCase();
          const matches: string[] = [];

          // Hex
          const hex = v.match(/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/g);
          if (hex) matches.push(...hex);

          // rgb()/rgba() - comma-separated
          const rgbComma = v.match(
            /rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+)?\s*\)/g
          );
          if (rgbComma) matches.push(...rgbComma);

          // rgb()/rgba() - space-separated (CSS Color Level 4)
          // Examples: rgb(7 161 130) / rgb(7 161 130 / 0.5)
          const rgbSpace = v.match(
            /rgba?\(\s*[\d.]+%?\s+[\d.]+%?\s+[\d.]+%?(?:\s*\/\s*[\d.]+)?\s*\)/g
          );
          if (rgbSpace) matches.push(...rgbSpace);

          // hsl()/hsla() - comma-separated
          const hslComma = v.match(
            /hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/g
          );
          if (hslComma) matches.push(...hslComma);

          // hsl()/hsla() - space-separated (CSS Color Level 4)
          // Examples: hsl(210 40% 98%) / hsl(210 40% 98% / 0.7)
          const hslSpace = v.match(
            /hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s+[\d.]+%\s+[\d.]+%(?:\s*\/\s*[\d.]+)?\s*\)/g
          );
          if (hslSpace) matches.push(...hslSpace);

          // Modern CSS colors (keep raw strings)
          const oklch = v.match(/oklch\([^\)]*\)/g);
          if (oklch) matches.push(...oklch);
          const oklab = v.match(/oklab\([^\)]*\)/g);
          if (oklab) matches.push(...oklab);
          const colorFn = v.match(/color\([^\)]*\)/g);
          if (colorFn) matches.push(...colorFn);

          return matches;
        };

        const extractColorsFromObject = (node: unknown): string[] => {
          const out: string[] = [];
          const visit = (n: unknown) => {
            if (!n) return;
            if (typeof n === "string") {
              out.push(...extractColorsFromString(n));
              return;
            }
            if (Array.isArray(n)) {
              n.forEach(visit);
              return;
            }
            if (typeof n === "object") {
              Object.values(n as Record<string, unknown>).forEach(visit);
            }
          };
          visit(node);
          return out;
        };

        const addExtraColors = (colorList: unknown) => {
          const list = Array.isArray(colorList)
            ? colorList
            : typeof colorList === "string"
              ? [colorList]
              : [];

          const unique = Array.from(
            new Set(
              list
                .filter((c) => typeof c === "string")
                .map((c) => c.trim().toLowerCase())
                .filter(Boolean)
            )
          ).slice(0, 80);

          if (unique.length === 0) return;

          const extra: BrandColors = {};
          unique.forEach((c, idx) => {
            extra[`extra${idx + 1}`] = c;
          });

          branding.colors = mergeColors(branding.colors || {}, extra);
        };

        // Always pull any additional colors already present in branding output (components, borders, etc.)
        addExtraColors(extractColorsFromObject(branding));

        // Also pull from any metadata fields (e.g., theme-color)
        addExtraColors(extractColorsFromObject(metadata));

        const mainRawHtml = mainData.data?.rawHtml || mainData.rawHtml;
        if (typeof mainRawHtml === "string") {
          addExtraColors(extractColorsFromString(mainRawHtml));
        }

        // Extract additional colors from the homepage (beyond the small "branding" palette)
        try {
          const extraColorResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              formats: ["json"],
              jsonOptions: { schema: colorSchema, prompt: colorPrompt },
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          const extraColorData = await extraColorResponse.json();
          const extracted = extraColorData.data?.json || extraColorData.json;
          addExtraColors(extracted?.colors);
        } catch (extraColorError) {
          console.error("Error extracting extra homepage colors:", extraColorError);
        }

        // Get sitemap
        const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            limit: 500,
            includeSubdomains: false,
          }),
        });

        const mapData = await mapResponse.json();
        console.log("Map response status:", mapResponse.status);
        console.log("Map data keys:", Object.keys(mapData));

        // Firecrawl map returns links in mapData.links array
        const siteLinks = mapData.links || mapData.data?.links || [];
        console.log("Found links from map:", siteLinks.length, "Sample:", siteLinks.slice(0, 3));

        if (mapResponse.ok) {
          // Get base domain for comparison
          const mainUrl = new URL(formattedUrl);
          const mainHostname = mainUrl.hostname.replace(/^www\./, "");
          const mainPath = mainUrl.pathname;
          const mainHash = mainUrl.hash;

          const isAssetUrl = (u: string) =>
            /\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot|pdf|zip|ico|webp)(\?.*)?$/i.test(
              u
            );

          const isHashRoute = (u: URL) => u.hash?.startsWith("#/");

          const routeKey = (u: URL) => {
            // Treat SPA hash routes as distinct "pages" (e.g. #/en/services)
            const hashPart = isHashRoute(u) ? u.hash : "";
            return `${u.origin}${u.pathname}${hashPart}`;
          };

          const isPureAnchor = (u: URL) => !!u.hash && !isHashRoute(u);

          const isExactHome = (u: URL) =>
            u.origin === mainUrl.origin &&
            u.pathname === mainPath &&
            (u.hash === "" || u.hash === mainHash);

          const normalizeCandidate = (link: string): { url: string; key: string } | null => {
            try {
              const u = new URL(link, formattedUrl);
              const linkHostname = u.hostname.replace(/^www\./, "");

              if (linkHostname !== mainHostname) return null;
              if (isAssetUrl(u.toString())) return null;
              if (isPureAnchor(u)) return null;
              if (isExactHome(u)) return null;

              // Reduce duplicates caused by query strings
              u.search = "";

              return { url: u.toString(), key: routeKey(u) };
            } catch {
              return null;
            }
          };

          // Merge map links + homepage scraped links (helps SPAs / hash-routing)
          const combinedLinks = Array.from(new Set<string>([...siteLinks, ...links]));

          // Seed queue with all discovered internal routes (not just the first N)
          const queue: string[] = [];
          const queuedKeys = new Set<string>();
          const scrapedKeys = new Set<string>();
          scrapedKeys.add(routeKey(mainUrl));

          const enqueue = (candidate: { url: string; key: string } | null) => {
            if (!candidate) return;
            if (queuedKeys.has(candidate.key)) return;
            if (scrapedKeys.has(candidate.key)) return;
            if (queue.length >= 400) return;
            queuedKeys.add(candidate.key);
            queue.push(candidate.url);
          };

          for (const link of combinedLinks) {
            enqueue(normalizeCandidate(link));
          }

          console.log(
            `Discovered ${queue.length} candidate pages (map + links). Target: ${maxPages}`
          );

          // Breadth-first scrape: each page can discover more links to follow
          while (queue.length > 0 && scrapedUrls.size < maxPages) {
            const pageUrl = queue.shift()!;
            if (scrapedUrls.has(pageUrl)) continue;

            try {
              console.log(`Scraping additional page: ${pageUrl}`);

              const pageResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: pageUrl,
                  formats: ["branding", "rawHtml", "links", "json"],
                  jsonOptions: { schema: colorSchema, prompt: colorPrompt },
                  onlyMainContent: false,
                  waitFor: 2000,
                }),
              });

              if (!pageResponse.ok) {
                let errorBody: unknown = null;
                try {
                  errorBody = await pageResponse.json();
                } catch {
                  // ignore
                }

                console.error("Additional page scrape failed", {
                  url: pageUrl,
                  status: pageResponse.status,
                  errorBody,
                });

                // Fallback: try without json extraction
                const fallbackResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url: pageUrl,
                    formats: ["branding", "rawHtml", "links"],
                    onlyMainContent: false,
                    waitFor: 2000,
                  }),
                });

                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json();
                  const pageBranding = fallbackData.data?.branding || fallbackData.branding;
                  const pageRawHtml = fallbackData.data?.rawHtml || fallbackData.rawHtml;
                  const pageLinks = fallbackData.data?.links || fallbackData.links || [];

                  addExtraColors(extractColorsFromObject(pageBranding));
                  if (typeof pageRawHtml === "string") {
                    addExtraColors(extractColorsFromString(pageRawHtml));
                  }

                  if (pageBranding?.colors) {
                    branding.colors = mergeColors(branding.colors || {}, pageBranding.colors);
                  }
                  if (pageBranding?.fonts) {
                    branding.fonts = mergeFonts(branding.fonts || [], pageBranding.fonts);
                  }

                  // enqueue newly discovered links
                  for (const l of pageLinks) {
                    enqueue(normalizeCandidate(l));
                  }

                  scrapedUrls.add(pageUrl);
                  scrapedKeys.add(routeKey(new URL(pageUrl)));
                  pagesScraped = scrapedUrls.size;
                  console.log(`Merged branding (fallback) from ${pageUrl}`);
                } else {
                  console.error("Fallback branding scrape also failed", {
                    url: pageUrl,
                    status: fallbackResponse.status,
                  });
                }

                continue;
              }

              const pageData = await pageResponse.json();

              const pageJson = pageData.data?.json || pageData.json;
              addExtraColors(pageJson?.colors);

              const pageBranding = pageData.data?.branding || pageData.branding;
              const pageRawHtml = pageData.data?.rawHtml || pageData.rawHtml;
              const pageLinks = pageData.data?.links || pageData.links || [];

              addExtraColors(extractColorsFromObject(pageBranding));
              if (typeof pageRawHtml === "string") {
                addExtraColors(extractColorsFromString(pageRawHtml));
              }

              if (pageBranding?.colors) {
                branding.colors = mergeColors(branding.colors || {}, pageBranding.colors);
              }

              if (pageBranding?.fonts) {
                branding.fonts = mergeFonts(branding.fonts || [], pageBranding.fonts);
              }

              // enqueue newly discovered links
              for (const l of pageLinks) {
                enqueue(normalizeCandidate(l));
              }

              scrapedUrls.add(pageUrl);
              scrapedKeys.add(routeKey(new URL(pageUrl)));
              pagesScraped = scrapedUrls.size;
              console.log(`Merged branding from ${pageUrl}`);
            } catch (pageError) {
              console.error(`Error scraping ${pageUrl}:`, pageError);
            }
          }

          // If map/links still didn't reach maxPages (common for SPAs), fallback to a crawl.
          if (scrapedUrls.size < maxPages) {
            console.log("Discovery still limited; crawling site to discover more pages...");

            try {
              const crawlResponse = await fetch("https://api.firecrawl.dev/v1/crawl", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: formattedUrl,
                  limit: maxPages,
                  maxDepth: 2,
                  includeSubdomains: false,
                  scrapeOptions: {
                    formats: ["branding", "rawHtml", "links"],
                    onlyMainContent: false,
                    waitFor: 2000,
                  },
                }),
              });

              const crawlBody = await crawlResponse.json();

              if (!crawlResponse.ok) {
                console.error("Crawl failed", {
                  status: crawlResponse.status,
                  crawlBody,
                });
              } else {
                const crawlPages = crawlBody.data?.data || crawlBody.data || [];
                console.log(
                  "Crawl returned pages:",
                  Array.isArray(crawlPages) ? crawlPages.length : 0
                );

                if (Array.isArray(crawlPages)) {
                  for (const page of crawlPages) {
                    if (scrapedUrls.size >= maxPages) break;

                    const discoveredUrl =
                      page?.metadata?.sourceURL ||
                      page?.metadata?.sourceUrl ||
                      page?.metadata?.url;

                    if (!discoveredUrl || scrapedUrls.has(discoveredUrl)) continue;

                    const crawlBranding = page?.branding || page?.data?.branding;
                    const crawlRawHtml = page?.rawHtml || page?.data?.rawHtml;

                    addExtraColors(extractColorsFromObject(crawlBranding));
                    if (typeof crawlRawHtml === "string") {
                      addExtraColors(extractColorsFromString(crawlRawHtml));
                    }

                    if (crawlBranding?.colors) {
                      branding.colors = mergeColors(branding.colors || {}, crawlBranding.colors);
                    }
                    if (crawlBranding?.fonts) {
                      branding.fonts = mergeFonts(branding.fonts || [], crawlBranding.fonts);
                    }

                    scrapedUrls.add(discoveredUrl);
                    pagesScraped = scrapedUrls.size;
                    console.log(`Merged crawl page: ${discoveredUrl}`);
                  }
                }
              }
            } catch (crawlError) {
              console.error("Error crawling site:", crawlError);
            }
          }
        }
      } catch (mapError) {
        console.error("Error mapping site:", mapError);
        // Continue with just the main page data
      }
    }

    console.log(`Brand extraction complete. Pages scraped: ${pagesScraped}`);

    // Extract colors from screenshot using Lovable AI
    let screenshotColors: string[] = [];
    if (screenshot && deep) {
      try {
        console.log("Extracting dominant colors from screenshot via AI...");
        const aiKey = Deno.env.get("LOVABLE_API_KEY");
        if (aiKey) {
          const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${aiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: 'Analyze this screenshot and extract the 8-12 most dominant/visible colors used for backgrounds, text, buttons, and accents. Return ONLY a valid JSON array of hex color strings, e.g. ["#FF6B35","#004E89"]. No explanation, just JSON.',
                      },
                      {
                        type: "image_url",
                        image_url: { url: screenshot },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            // Parse JSON array from content (may have markdown or extra text)
            const match = content.match(/\[[\s\S]*?\]/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed)) {
                  screenshotColors = parsed
                    .filter((c: unknown) => typeof c === "string" && c.startsWith("#"))
                    .slice(0, 12);
                  console.log("Screenshot colors extracted:", screenshotColors);

                  // Merge into branding.colors
                  const extra: { [key: string]: string } = {};
                  screenshotColors.forEach((c, idx) => {
                    extra[`screenshot${idx + 1}`] = c;
                  });
                  branding.colors = mergeColors(branding.colors || {}, extra);
                }
              } catch {
                console.error("Failed to parse AI color JSON");
              }
            }
          } else {
            console.error("AI screenshot color extraction failed", aiResponse.status);
          }
        }
      } catch (aiError) {
        console.error("Error extracting screenshot colors:", aiError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        branding,
        screenshot,
        metadata,
        links,
        sourceUrl: formattedUrl,
        pagesScraped,
        scrapedUrls: Array.from(scrapedUrls),
        screenshotColors,
        deep,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error extracting brand:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to extract brand";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
