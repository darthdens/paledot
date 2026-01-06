import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const platformGuidelines: Record<string, string> = {
  general: "Write versatile copy suitable for any context.",
  linkedin: "Write professional, enterprise-grade copy suitable for LinkedIn. Use business language, focus on value propositions, thought leadership, and professional credibility. Avoid overly casual language.",
  twitter: "Write concise, punchy copy for Twitter/X. Keep it short, use hooks, be conversational. Consider character limits. Use engaging language that encourages shares and replies.",
  instagram: "Write visually-oriented, lifestyle-focused copy for Instagram. Be authentic, use emojis sparingly, focus on storytelling and emotion. Consider that this will pair with visual content.",
  facebook: "Write community-focused, shareable copy for Facebook. Balance professional and personal tones, encourage engagement and discussion. Can be slightly longer than Twitter.",
  email: "Write compelling email copy. Focus on subject lines that drive opens, body copy that converts. Be personal, clear, and action-oriented.",
  website: "Write conversion-focused web copy. Clear value propositions, scannable format, strong CTAs. Focus on benefits and user outcomes.",
  blog: "Write engaging blog content. Informative, well-structured, SEO-friendly. Balance education with entertainment. Use headers and clear formatting.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, copyType, tone, platform, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const platformGuide = platformGuidelines[platform] || platformGuidelines.general;

    const systemPrompt = `You are an expert copywriter who creates compelling, conversion-focused copy. You adapt your writing style based on the requested tone, purpose, and platform.

IMPORTANT INSTRUCTIONS:
- Write in ${language === 'fr' ? 'French' : 'English'}
- Match the requested tone exactly
- Be creative but stay on-brand
- Focus on benefits, not just features
- Use power words that evoke emotion
- Keep copy concise and impactful
- Return ONLY the copy, no explanations or meta-commentary

Copy Type: ${copyType}
Tone: ${tone}
Platform: ${platform}

PLATFORM GUIDELINES:
${platformGuide}`;

    console.log(`Generating copy - Type: ${copyType}, Tone: ${tone}, Platform: ${platform}, Language: ${language}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("generate-copy error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
