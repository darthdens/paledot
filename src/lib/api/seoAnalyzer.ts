import { supabase } from "@/integrations/supabase/client";

export interface SeoAnalysisResult {
  success: boolean;
  error?: string;
  url?: string;
  score?: number;
  meta?: {
    title?: {
      content: string;
      length: number;
      status: "pass" | "warning" | "fail";
    };
    description?: {
      content: string;
      length: number;
      status: "pass" | "warning" | "fail";
    };
    canonical?: {
      content: string;
      status: "pass" | "warning" | "fail";
    };
    viewport?: {
      content: string;
      status: "pass" | "warning" | "fail";
    };
  };
  headings?: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  images?: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  links?: {
    total: number;
    internal: number;
    external: number;
  };
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  performance?: Array<{
    label: string;
    description: string;
    status: "pass" | "warning" | "fail";
  }>;
  recommendations?: string[];
}

export async function analyzeSeo(url: string): Promise<SeoAnalysisResult> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-seo", {
      body: { url },
    });

    if (error) {
      console.error("SEO analysis error:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error("SEO analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze SEO",
    };
  }
}
