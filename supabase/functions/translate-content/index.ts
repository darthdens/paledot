/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  texts: {
    key: string;
    value: string;
  }[];
  targetLanguage: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage } = await req.json() as TranslateRequest;

    if (!texts || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No texts provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Translating ${texts.length} texts to ${targetLanguage}`);

    // Build the prompt for translation
    const textsToTranslate = texts
      .filter(t => t.value && t.value.trim())
      .map(t => `[${t.key}]: ${t.value}`)
      .join("\n\n");

    if (!textsToTranslate) {
      return new Response(
        JSON.stringify({ translations: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a professional translator. Translate the following texts to ${targetLanguage === 'fr' ? 'French' : 'English'}. 
Maintain the exact same formatting, HTML tags, and structure. Only translate the text content.
Return the translations in JSON format with the same keys provided.
Do not add any explanations, just return valid JSON.`;

    const userPrompt = `Translate these texts:

${textsToTranslate}

Return as JSON object like: {"key1": "translated text 1", "key2": "translated text 2"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response:", content);

    // Parse the JSON response - handle markdown code blocks
    let translations: Record<string, string>;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      translations = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse translation response");
    }

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Translation failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
