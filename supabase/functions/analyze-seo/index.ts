const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeoResult {
  success: boolean;
  error?: string;
  url?: string;
  score?: number;
  meta?: {
    title?: { content: string; length: number; status: "pass" | "warning" | "fail" };
    description?: { content: string; length: number; status: "pass" | "warning" | "fail" };
    canonical?: { content: string; status: "pass" | "warning" | "fail" };
    viewport?: { content: string; status: "pass" | "warning" | "fail" };
  };
  headings?: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
  images?: { total: number; withAlt: number; withoutAlt: number };
  links?: { total: number; internal: number; external: number };
  openGraph?: { title?: string; description?: string; image?: string; type?: string };
  performance?: Array<{ key: string; status: "pass" | "warning" | "fail" }>;
  recommendations?: string[];
}

function formatUrl(url: string): string {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = `https://${formattedUrl}`;
  }
  return formattedUrl;
}

function extractMetaContent(html: string, name: string): string | null {
  // Check name attribute
  const nameRegex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const nameMatch = html.match(nameRegex);
  if (nameMatch) return nameMatch[1];

  // Check property attribute (for og: tags)
  const propRegex = new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const propMatch = html.match(propRegex);
  if (propMatch) return propMatch[1];

  // Check reverse order (content before name/property)
  const reverseNameRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i");
  const reverseNameMatch = html.match(reverseNameRegex);
  if (reverseNameMatch) return reverseNameMatch[1];

  const reversePropRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i");
  const reversePropMatch = html.match(reversePropRegex);
  if (reversePropMatch) return reversePropMatch[1];

  return null;
}

function countHeadings(html: string): { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number } {
  // Remove script, style, noscript, and comments to avoid false positives
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  
  // Match opening h tags more precisely - handles attributes and whitespace
  return {
    h1: (cleanHtml.match(/<h1\b[^>]*>/gi) || []).length,
    h2: (cleanHtml.match(/<h2\b[^>]*>/gi) || []).length,
    h3: (cleanHtml.match(/<h3\b[^>]*>/gi) || []).length,
    h4: (cleanHtml.match(/<h4\b[^>]*>/gi) || []).length,
    h5: (cleanHtml.match(/<h5\b[^>]*>/gi) || []).length,
    h6: (cleanHtml.match(/<h6\b[^>]*>/gi) || []).length,
  };
}

function analyzeImages(html: string): { total: number; withAlt: number; withoutAlt: number } {
  // Remove script, style, noscript, and comments
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  
  // Match img tags - handles self-closing and regular
  const imgTags = cleanHtml.match(/<img\b[^>]*\/?>/gi) || [];
  const total = imgTags.length;
  let withAlt = 0;

  for (const img of imgTags) {
    // Check for non-empty alt attribute (handles various quote styles)
    if (/\balt\s*=\s*["'][^"']+["']/i.test(img) || /\balt\s*=\s*[^\s>]+/i.test(img)) {
      withAlt++;
    }
  }

  return { total, withAlt, withoutAlt: total - withAlt };
}

function analyzeLinks(html: string, baseUrl: string): { total: number; internal: number; external: number } {
  // Remove script, style, noscript, and comments
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  
  // Match all anchor tags (not just those with href first)
  const linkTags = cleanHtml.match(/<a\b[^>]*>/gi) || [];
  let internal = 0;
  let external = 0;
  let validLinks = 0;

  const baseHost = new URL(baseUrl).hostname;

  for (const link of linkTags) {
    // Extract href from anywhere in the tag
    const hrefMatch = link.match(/\bhref\s*=\s*["']([^"']*)["']/i) || link.match(/\bhref\s*=\s*([^\s>]+)/i);
    if (hrefMatch) {
      const href = hrefMatch[1].trim();
      // Skip empty hrefs, javascript:, mailto:, tel:, #
      if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        continue;
      }
      validLinks++;
      if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
        internal++;
      } else if (href.startsWith("#")) {
        internal++; // Anchor links are internal
      } else if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const linkHost = new URL(href).hostname;
          if (linkHost === baseHost || linkHost.endsWith("." + baseHost) || baseHost.endsWith("." + linkHost)) {
            internal++;
          } else {
            external++;
          }
        } catch {
          internal++;
        }
      } else {
        internal++; // Relative URL without leading slash
      }
    }
  }

  return { total: validLinks, internal, external };
}

function calculateScore(result: Partial<SeoResult>): number {
  let score = 0;
  let checks = 0;

  // Title (20 points)
  checks++;
  if (result.meta?.title?.status === "pass") score += 20;
  else if (result.meta?.title?.status === "warning") score += 10;

  // Description (20 points)
  checks++;
  if (result.meta?.description?.status === "pass") score += 20;
  else if (result.meta?.description?.status === "warning") score += 10;

  // Viewport (10 points)
  checks++;
  if (result.meta?.viewport?.status === "pass") score += 10;

  // H1 (15 points)
  checks++;
  if (result.headings?.h1 === 1) score += 15;
  else if (result.headings?.h1 && result.headings.h1 > 1) score += 5;

  // Images with alt (15 points)
  checks++;
  if (result.images?.total === 0 || result.images?.withoutAlt === 0) score += 15;
  else if (result.images && result.images.withAlt / result.images.total > 0.8) score += 10;
  else if (result.images && result.images.withAlt / result.images.total > 0.5) score += 5;

  // Open Graph (10 points)
  checks++;
  const ogChecks = [
    result.openGraph?.title,
    result.openGraph?.description,
    result.openGraph?.image,
  ].filter(Boolean).length;
  score += Math.round((ogChecks / 3) * 10);

  // Canonical (10 points)
  checks++;
  if (result.meta?.canonical?.status === "pass") score += 10;

  return Math.round(score);
}

function generateRecommendations(result: Partial<SeoResult>): string[] {
  const recommendations: string[] = [];

  if (!result.meta?.title?.content) {
    recommendations.push("addTitle");
  } else if (result.meta.title.length < 30) {
    recommendations.push("titleTooShort");
  } else if (result.meta.title.length > 60) {
    recommendations.push("titleTooLong");
  }

  if (!result.meta?.description?.content) {
    recommendations.push("addDescription");
  } else if (result.meta.description.length < 70) {
    recommendations.push("descriptionTooShort");
  } else if (result.meta.description.length > 160) {
    recommendations.push("descriptionTooLong");
  }

  if (!result.meta?.viewport?.content) {
    recommendations.push("addViewport");
  }

  if (!result.meta?.canonical?.content) {
    recommendations.push("addCanonical");
  }

  if (result.headings?.h1 === 0) {
    recommendations.push("addH1");
  } else if (result.headings && result.headings.h1 > 1) {
    recommendations.push("singleH1");
  }

  if (result.images && result.images.withoutAlt > 0) {
    recommendations.push("addAltText");
  }

  if (!result.openGraph?.title) {
    recommendations.push("addOgTitle");
  }
  if (!result.openGraph?.description) {
    recommendations.push("addOgDescription");
  }
  if (!result.openGraph?.image) {
    recommendations.push("addOgImage");
  }

  return recommendations;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedUrl = formatUrl(url);
    console.log("Analyzing SEO for:", formattedUrl);

    // Fetch the page
    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0; +https://seo.dens.so)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const description = extractMetaContent(html, "description") || "";

    // Extract canonical
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : "";

    // Extract viewport
    const viewport = extractMetaContent(html, "viewport") || "";

    // Extract Open Graph
    const ogTitle = extractMetaContent(html, "og:title") || "";
    const ogDescription = extractMetaContent(html, "og:description") || "";
    const ogImage = extractMetaContent(html, "og:image") || "";
    const ogType = extractMetaContent(html, "og:type") || "";

    // Count headings
    const headings = countHeadings(html);

    // Analyze images
    const images = analyzeImages(html);

    // Analyze links
    const links = analyzeLinks(html, formattedUrl);

    // Build result
    const result: SeoResult = {
      success: true,
      url: formattedUrl,
      meta: {
        title: {
          content: title,
          length: title.length,
          status: title.length >= 30 && title.length <= 60 ? "pass" : title.length > 0 ? "warning" : "fail",
        },
        description: {
          content: description,
          length: description.length,
          status: description.length >= 70 && description.length <= 160 ? "pass" : description.length > 0 ? "warning" : "fail",
        },
        canonical: {
          content: canonical,
          status: canonical ? "pass" : "fail",
        },
        viewport: {
          content: viewport,
          status: viewport ? "pass" : "fail",
        },
      },
      headings,
      images,
      links,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        type: ogType,
      },
      performance: [
        {
          key: "https",
          status: formattedUrl.startsWith("https://") ? "pass" : "fail",
        },
        {
          key: "viewport",
          status: viewport ? "pass" : "fail",
        },
        {
          key: "doctype",
          status: html.toLowerCase().includes("<!doctype html>") ? "pass" : "warning",
        },
        {
          key: "language",
          status: html.match(/<html[^>]+lang=["'][^"']+["']/i) ? "pass" : "warning",
        },
      ],
    };

    // Calculate score
    result.score = calculateScore(result);

    // Generate recommendations
    result.recommendations = generateRecommendations(result);

    console.log("SEO analysis complete. Score:", result.score);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing SEO:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze SEO",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
