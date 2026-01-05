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

    // Step 1: Always scrape the main page first
    const mainResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["branding", "screenshot", "links"],
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
        // Get sitemap
        const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            limit: 50,
            includeSubdomains: false,
          }),
        });

        const mapData = await mapResponse.json();
        
        if (mapResponse.ok && mapData.links) {
          // Filter to get unique internal pages (excluding homepage and assets)
          const internalLinks = mapData.links
            .filter((link: string) => {
              const linkUrl = new URL(link);
              const mainUrl = new URL(formattedUrl);
              return (
                linkUrl.hostname === mainUrl.hostname &&
                link !== formattedUrl &&
                !link.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot|pdf|zip)$/i)
              );
            })
            .slice(0, maxPages - 1); // Already scraped homepage

          console.log(`Found ${internalLinks.length} additional pages to scrape`);

          // Scrape each additional page for branding
          for (const pageUrl of internalLinks) {
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
                  formats: ["branding"],
                  onlyMainContent: false,
                  waitFor: 2000,
                }),
              });

              if (pageResponse.ok) {
                const pageData = await pageResponse.json();
                const pageBranding = pageData.data?.branding || pageData.branding;
                
                if (pageBranding) {
                  // Merge colors
                  if (pageBranding.colors) {
                    branding.colors = mergeColors(branding.colors || {}, pageBranding.colors);
                  }
                  
                  // Merge fonts
                  if (pageBranding.fonts) {
                    branding.fonts = mergeFonts(branding.fonts || [], pageBranding.fonts);
                  }
                  
                  pagesScraped++;
                  console.log(`Merged branding from ${pageUrl}`);
                }
              }
            } catch (pageError) {
              console.error(`Error scraping ${pageUrl}:`, pageError);
              // Continue with other pages
            }
          }
        }
      } catch (mapError) {
        console.error("Error mapping site:", mapError);
        // Continue with just the main page data
      }
    }

    console.log(`Brand extraction complete. Pages scraped: ${pagesScraped}`);

    return new Response(
      JSON.stringify({
        success: true,
        branding,
        screenshot,
        metadata,
        links,
        sourceUrl: formattedUrl,
        pagesScraped,
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
